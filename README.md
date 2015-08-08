# intuit-cad
node package for obtaining building a SAML assertion message and making calls to intuit's Customer Account Data (CAD) API.  Built with promises ([KrisKowal's Q Library](https://github.com/kriskowal/q)) in mind this makes implementing/chaining very easy and straightforward.   Written in pure javascript this makes extension of library easy and maintainable.  


##Getting Started
Using this library is quite simple.  
Initial setup includes:
1.  Install the Library - `npm install intuit-cad`
2.  require it to your applicaiton - `var IntuitCad = require('intuit-cad');`
3.  instantiate the client with your credentials - `var client = new IntuitCad(authCreds)`

Setting up configuration variables

There are two ways to set your configuration for your authentication for intuit 
	1. Environment variables - Recommended 
	2. Manually set variables

###Setting up Environment Variables 
The recommended approach when using any library that requires passwords/tokens/private information to be used is to use environment variables.  Since most written code is version controlled either by Git or some other system, one would not want to save passwords in configuration files because the passwords are then saved to that repository's history.  These separate the need to maintain these passwords elsewhere.   For this library we need to set up four environment variables:


1.  `INTUIT_KEY_PASSPHRASE` - this is your passphrase for your private key
2.  `INTUIT_ISSUER_ID` - This is going to be your Intuit's `SAML Identity Provider ID` found in on intuit's application console under your application
3.  `INTUIT_CONSUMER_KEY` - the consumer key you were given by intuit CAD
4.  `INTUIT_CONSUMER_SECRET` - the secret to your consumer key given by intuit CAD when you created your first application

Here's an image of whats displayed after first creating your application with Intuit.  

![](http://res.cloudinary.com/buddahbelly/image/upload/v1438950073/brilliantbritz/intuit-cad/intuit-cad-myapp.png)

To set up environment variables on a Mac all you need to do is `export` them in a terminal shell.  For example, the command for doing so is:
>`export INTUIT_CONSUMER_KEY=ConsumerKey`

###Manually Set Variables
If you are doing testing and not saving this to a repository, or just dont want to set up environment variables, you can set them manually and pass them as a `credential` object into the `intuit-cad` instantiation.  An example config object looks like so:

>`var authCredentials ={
  issuerId: process.env.INTUIT_ISSUER_ID || 'nothing',
  consumerKey:process.env.INTUIT_CONSUMER_KEY || 'CONSUMERKEY',
  consumerSecret: process.env.INTUIT_CONSUMER_SECRET || 'CONSUMER_SECRET',
  privateKeyPath: '/Users/chrisbritz/Documents/projects/compendium-advisor/comptest.key',
  customerId: '3'
};`
>

if none of the environment variables are set it will take whatever you set it to.  For instance, in the line:

>`consumerKey:process.env.INTUIT_CONSUMER_KEY || 'CONSUMERKEY'`

it will use `CONSUMERKEY` as the value of `consumerKey`.

##Chaining Promise Methods
Since all of the methods return a promise we can chain them like the documentation for [KrisKowal's Docs on Chaining Promises](https://github.com/kriskowal/q#chaining) There are a couple of API calls that require data from a previous call, like `deleteAccount` requires the `getCustomerAccount` to be called initially because we need an `accountId` for the account we want to delete. This is where chaining promises comes in handy.  If I were to implement the above example, where I need to get the `accountId` on a specific account I want to delete I need to first call:

```javascript
client.getCustomerAccounts()
  .then(function(accounts){
  
    var deleteAccountId = accounts[0].accountId;

    client.deleteAccount(deleteAccountId)
      .then(function(){
        console.log('deleted account');
      },
      function(reason){});
  })
```

##Example Usage
```javascript
var authCredentials ={
  issuerId: process.env.INTUIT_ISSUER_ID || 'nothing',
  consumerKey:process.env.INTUIT_CONSUMER_KEY || 'CONSUMERKEY',
  consumerSecret: process.env.INTUIT_CONSUMER_SECRET || 'CONSUMER_SECRET',
  privateKeyPath: '/Users/deputydog/Documents/projects/apps/comptest.key',
  customerId: '3'
};
var IntuitCad = require('intuit-cad');

var client = new IntuitCad(authCredentials);

client.institutionDetails(100000)
  .then(function(details){
    console.log('DETAILS: ', details);
  })

client.discoverAndAddAccounts('direct', 'blah', 100000)
  .then(function(accounts){
    console.log('DISCOVERED ACCOUNTS: ', accounts);
  });

//using account i got from client.getAccounts()
client.getAccount(400109423068)
  .then(function(accountDetail){
    console.log('GET CUSTOMER ACCOUNT DETAIL: ', accountDetail);
  });
  
//Chainng function example.    
client.getCustomerAccounts()
  .then(function(accounts){

    var deleteAccountId = accounts[0].accountId;

    client.deleteAccount(deleteAccountId)
      .then(function(){
        console.log('deleted account');
      },
      function(reason){});
  })

```


