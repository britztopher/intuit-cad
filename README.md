# intuit-cad
node package for obtaining building a SAML assertion message and making calls to intuit's Customer Account Data (CAD) API 


##Getting Started
###Setting up Environment Variables
You need to set up the following environment variables on your machine.  

1.  INTUIT_KEY_PASSPHRASE - this is your passphrase for your private key
2.  INTUIT_ISSUER_ID - This is going to be your Intuit's `SAML Identity Provider ID` found in on intuit's application console under your application
3.  INTUIT_NAME_ID - this is the unique identifier for all every customer
4.  INTUIT_CONSUMER_KEY - the consumer key you were given by intuit CAD

The private key file that I sign with is hard coded right now, but as long as you create the .key file as comptest.key and put it in the server directory it should work.
