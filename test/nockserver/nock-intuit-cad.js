var nock = require('nock');

module.exports = {
  stubOAuth: function(retries){

    var retries = retries || 1;
    nock("https://oauth.intuit.com:443")
      .filteringRequestBody(function(body){
        return 'SAML';
      })
      .post('/oauth/v1/get_access_token_by_saml', 'SAML')
      .times(retries)
      .reply(200, 'oauth_token_secret=L63cI4q5UhP4mQzpCi1RHBMSLe2TNOaI98vxyIBL&oauth_token=qyprdcvDh5V2XoJRwYmxxdL5vOJ54Z6sNVohlNLQHyyhHaAy')


  }
};