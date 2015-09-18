var request = require('request');
var swig = require('swig');
var moment = require('moment');
var crypto = require('crypto');
var uuid = require('node-uuid');
var q = require('q');
var logger = require('winston');

//member vars
var SAML_URL = 'https://oauth.intuit.com/oauth/v1/get_access_token_by_saml';
var timeFormat = 'YYYY-MM-DD LZ';
var OAUTH_TOKEN_TIMEOUT = 3600000;

var IntuitAuth = function(authCreds, options){

  if(options){
    logger.level = options.logLevel || 'info';
  }

  this.authCreds = authCreds;

};

IntuitAuth.prototype = {

  setOauthObj: function(oauthInfo){
    this.oauthInfo = oauthInfo;
  },
  getOauthObj: function(){
    return this.oauthInfo;
  },
  authenticate: function(){

    var self = this;
    var deferred = q.defer();

    var assertionSigned64 = this.createSamlAssertion();

    this.makeSamlRequest(assertionSigned64)
      .then(function(oauthObj){
        logger.debug('Got oauth token from saml request', oauthObj)
        //set the expire time 1 hour after we got it.  I use 58 just because i want to not wait until it expires to get
        //a new token
        oauthObj.tokenExpireTime = moment(Date.now()).add(58, 'minutes');
        self.setOauthObj(oauthObj);
        deferred.resolve(oauthObj);
      },
      function(reason){
        deferred.reject('intuit-cad::intuit-auth::authenticate::'+reason);
      });


    return deferred.promise;
  },
  createSamlAssertion: function(){

    //Assertion message buildup xml
    var assertion =
      '<saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion" ID="_{{id}}" IssueInstant="{{issueInstant}}" Version="2.0">' +
      '<saml2:Issuer>{{issuerId}}</saml2:Issuer>' +
      '<saml2:Subject>' +
      '<saml2:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">{{customerId}}</saml2:NameID>' +
      '<saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"></saml2:SubjectConfirmation>' +
      '</saml2:Subject>' +
      '<saml2:Conditions NotBefore="{{notBefore}}" NotOnOrAfter="{{notOnOrAfter}}">' +
      '<saml2:AudienceRestriction>' +
      '<saml2:Audience>{{issuerId}}</saml2:Audience>' +
      '</saml2:AudienceRestriction>' +
      '</saml2:Conditions>' +
      '<saml2:AuthnStatement AuthnInstant="{{issueInstant}}" SessionIndex="_{{id}}">' +
      '<saml2:AuthnContext>' +
      '<saml2:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml2:AuthnContextClassRef>' +
      '</saml2:AuthnContext>' +
      '</saml2:AuthnStatement>' +
      '</saml2:Assertion>';

    var signedInfo =
      '<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">' +
      '<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></ds:CanonicalizationMethod>' +
      '<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></ds:SignatureMethod>' +
      '<ds:Reference URI="#_{{id}}">' +
      '<ds:Transforms>' +
      '<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></ds:Transform>' +
      '<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></ds:Transform>' +
      '</ds:Transforms>' +
      '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></ds:DigestMethod>' +
      '<ds:DigestValue>' +
      '{{digest}}' +
      '</ds:DigestValue>' +
      '</ds:Reference>' +
      '</ds:SignedInfo>';

    var signature =
      '<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">' +
      '<ds:SignedInfo>' +
      '<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>' +
      '<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>' +
      '<ds:Reference URI="#_{{id}}">' +
      '<ds:Transforms>' +
      '<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>' +
      '<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>' +
      '</ds:Transforms>' +
      '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>' +
      '<ds:DigestValue>{{digest}}</ds:DigestValue>' +
      '</ds:Reference>' +
      '</ds:SignedInfo>' +
      '<ds:SignatureValue>{{signatureValue}}</ds:SignatureValue>' +
      '</ds:Signature>'

    //generate a secure uuid using secure random
    var id = uuid.v4({rng: uuid.nodeRNG}).replace(/-/g, '');

    //all my templates
    var assertTpl = swig.compile(assertion);
    var signedTpl = swig.compile(signedInfo);
    var signature = swig.compile(signature);

    //need to calculate signage condition times - i use momentjs for this
    var now = moment();
    var instant = moment(now, timeFormat).format();
    var notBefore = moment(now, timeFormat).subtract(5, 'minutes').format();
    var notOnOrAfter = moment(now, timeFormat).add(10, 'minutes').format();

    //swig template values for assertion message
    var assertionInfo = {
      issueInstant: instant,
      notBefore: notBefore,
      notOnOrAfter: notOnOrAfter,
      id: id,
      issuerId: this.authCreds.issuerId,
      customerId: this.authCreds.customerId
    };

    //render swig plain assertion message with the values filled in
    var renderedAssertion = assertTpl(assertionInfo)
    var assertionSha1Digest = this.getAssertionSha(renderedAssertion);

    //get the values for next template which is the digest of the assertion
    var signedInfo = {
      digest: assertionSha1Digest,
      id: id
    };

    //render the SignedInfo element section with digest
    var signedInfoXmlRendered = signedTpl(signedInfo);

    //send the rendered signed info xml to be signed
    var signatureValue = this.signAssertion(signedInfoXmlRendered)

    //add the signature value to the signedinfo object so it will be populated when we render the swig template
    signedInfo.signatureValue = signatureValue;

    //render the signature piece of xml with the signnature value and digest
    var signatureSigned = signature(signedInfo);

    //substitute the signature into the assertion xml
    var assertionWithSignature = renderedAssertion.replace(/saml2:Issuer\>\<saml2:Subject/, 'saml2:Issuer>{% autoescape false %}{{signature}}<saml2:Subject')

    var signedAssertion = swig.compile(assertionWithSignature);
    //render the whole assertion message with the signature portion
    var completeAssertion = signedAssertion({signature: signatureSigned});

    if(this.writeAssertionFile){
      fs.writeFileSync('signed.xml', completeAssertion);
    }

    //finally base64 encode for transmission
    completeAssertion = new Buffer(completeAssertion).toString('base64');


    //logger.debug('intuit-cad::intuit-auth::finished saml assertion');
    return completeAssertion;
  },
  getAssertionSha: function(assertion){
    //create sha1 hash for assertion then base64 it
    return crypto.createHash('sha1').update(assertion).digest('base64').trim();
  },
  makeSamlRequest: function(message, callback){

    var deferred = q.defer();
    var oauth = {};

    //set the options for the saml request to get the oauth tokens
    var options = {
      url: SAML_URL,
      headers: {
        'Content-Type': 'application/json',
        'Content-Language': 'en-US',
        'Authorization': 'OAuth oauth_consumer_key="' + this.authCreds.consumerKey + '"'
      },
      form: {saml_assertion: message}
    };

    //make the post request
    request.post(options, function(error, response, body){
      if(error){
        logger.error('intuit-cad::intuit-auth::could not send post request with assertion message because: \n', error);
        deferred.reject('intuit-cad::intuit-auth::request could not be completed because: ' + JSON.stringify(error));
      }

      //logger.debug('intuit-cad::intuit-auth::made saml request', decodeURI(body));

      if(body.indexOf('oauth_problem') == 1){
        deferred.reject('intuit-cad::intuit-auth::cannot perform oauth token lookup because of SAML VALIDATION:\n' +
          'ERROR::: ' + decodeURI(body));
        logger.error('intuit-cad::intuit-auth::'+decodeURI(body));
      }

      //split up the body
      var splitBodyArr = body.split('&');
      //populate oauth object
      oauth.tokenSecret = splitBodyArr[0].split('=')[1];
      oauth.token = splitBodyArr[1].split('=')[1];

      //resolve with oauth information from
      deferred.resolve(oauth);
    });

    return deferred.promise;

  },
  signAssertion: function(signedInfoXml){

    //sign the signed info xml with the private key
    var signer = crypto.createSign('RSA-SHA1');
    signer.update(signedInfoXml);
    var signatureValue = signer.sign(this.authCreds.privateKey, 'base64').replace(/\n/, '');

    return signatureValue;
  }
};


module.exports = IntuitAuth;
