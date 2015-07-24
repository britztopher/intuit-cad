var Intuitcad = require('../intuitcad/saml2');


var issuerId = process.env.INTUIT_ISSUER_ID || 'nothing';
consumerKey=process.env.INTUIT_CONSUMER_KEY || 'CONSUMERKEY',
  privateKeyPath= '/comptest.key',
  customerId= 'blah321'

var intuit = new Intuitcad(issuerId, customerId, consumerKey, privateKeyPath);


intuit.authenticate();
