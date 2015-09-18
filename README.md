# intuit-cad
node package for building a SAML assertion message and making calls to intuit's Customer Account Data (CAD) API.  Built with promises ([KrisKowal's Q Library](https://github.com/kriskowal/q)) in mind this makes implementing/chaining very easy and straightforward.   Written in pure javascript this makes extension of library easy and maintainable.  


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

Both ways are handled the same way for the instantiation of the module, however, evironment variables are safer and more secure.

###Setting up Authentication Object 
   >NOTE: The recommended approach when using any library that requires passwords/tokens/private information to be used is to use environment variables.  Since most written code is version controlled either by Git or some other system, one would not want to save passwords in configuration files because the passwords are then saved to that repository's history.  These separate the need to maintain these passwords elsewhere. 

####Authentication Object
In order for intuit to authenticate your SAML and OAuth API key we need to provide the OAuth server some information to verify we are able to use their CAD API.  We do this by building an authentication object and passing it to the constructor of the module (ie - `var client = new IntuitCad(authCredentials);`).  This authentication object is built with this information:
```javascript
var authCredentials ={
  issuerId: process.env.INTUIT_ISSUER_ID || 'myIssuerId',
  consumerKey:process.env.INTUIT_CONSUMER_KEY || 'CONSUMERKEY',
  consumerSecret: process.env.INTUIT_CONSUMER_SECRET || 'CONSUMER_SECRET',
  privateKeyPath: '/Users/britztopher/Documents/keys/comptest.key',
  customerId: '3'
};
```
>BEST PRACTICE: Use environment variables here to eliminate saving passwords and sensitive information to my Git repository. (ie - `process.env.INTUIT_ISSUER_ID` is used for environment variable `INTUIT_ISSUER_ID`);

######issuerId
the SAML Identity Provider ID 
######consumerKey
the key that is given to your Intuit account when signing up
######consumerSecret
the secret which is given to your Intuit account when signing up
######privateKeyPath
the path to your private key 
######customerId
this is a unique ID for each customer you plan on associating an Intuit account for.  This should be unique for every instantiation of the module, so each OAuth key is different for each customer.  
>NOTE: do not use the same customerId for every request to CAD API. (ie - maybe use database primary key for customer)

Below is an image of what information is provided by Intuit when you sign up and create your application.  This is found on your application's dashboard.

![](http://res.cloudinary.com/buddahbelly/image/upload/v1438950073/brilliantbritz/intuit-cad/intuit-cad-myapp.png)

To set up environment variables on a Mac all you need to do is `export` them in a terminal shell.  For example, the command for doing so is:
>`export INTUIT_CONSUMER_KEY=ConsumerKey`

if none of the environment variables are set it will take whatever you set it to.  For instance, in the line:

>`consumerKey:process.env.INTUIT_CONSUMER_KEY || 'CONSUMERKEY'`

it will use `CONSUMERKEY` as the value of `consumerKey`.

##Options
There are a certain amount of options that are available.  Right now, the only one is setting the logging level. To use options, you can pass an options object as a argument in the instatiation of the `IntuitCad` object.

####logLevel
The `logLevel` option allows helps you debug your code by providing output from the `intuit-cad` library.  It has 3 levels: `info`, `debug`, and `error`.  

#####Default Value:
`info`

######Example:
```javascript
...
  var options = {logLevel: 'debug'};
  var client = new IntuitCad(authCredentials, options);
```
##API Methods Available
###institutions
this returns all the institutions that Intuit CAD system supports (around 19,000 of them)
#####usage
```javascript
client.institutions()
  .then(function(institutions){
    console.log('institutions: ', institutions);
  },
  function(reason){
  	//reason for failure
  });
```

###institutionDetails(institution_id)
this returns a specific institutions details
#####usage
```javascript
client.institutionDetails(100000)
  .then(function(details){
    console.log('DETAILS: ', details);
  },
  function(reason){
  //reason for failure
  });
```

###discoverAndAddAccounts(username, password, institution_id)
method for discovering and adding a customer's account to Intuit's database for you to query against
#####usage
```javascript
client.discoverAndAddAccounts('direct', 'blah', 100000)
  .then(function(accounts){
    console.log('DISCOVERED ACCOUNTS: ', accounts);
  },
  function(reason){
    console.log('reason for failure was because: ', reason);
  });
```
###getCustomerAccounts
method for getting all the customer's accounts that was added in the `discoverAndAddAccounts` method.  This will use the `customerId` you specified when authenticating to get that customer's accounts i.e -  `customerId: '3'`
#####usage
```javascript
client.getCustomerAccounts()
  .then(function(accounts){
  });
```  

###getLoginAccounts(institutionLoginId)
returns all login accounts for a specific institution.  The institutionLoginId is returned with a call to `getCustomerAccounts` or any other method that returns account specific data
#####usage
```javascript
client.getLoginAccounts(1284060126)
  .then(function(loginAccounts){
    console.log('login accounts: ', loginAccounts);
  },
  function(reason){
    console.log('could not get login accounts because of: ', reason);
  });
```
###getAccount(account_id)
gets the details of a specific Account given the account ID  
#####usage
```javascript
client.getAccount(400109423068)
  .then(function(accountDetail){
    console.log('GET CUSTOMER ACCOUNT DETAIL: ', accountDetail);
  },
  function(reason){
    console.log('could not get account because of: ', reason);
  });
```
###getAccountTransactions(accountId, txnStartDate, txnEndDate)
returns the transactions for a specific accound between a start and end date given in the format `YYYY/MM/DD`
#####usage
```javascript
client.getAccountTransactions(400109423068, '2015-07-01', '2015-07-29')
  .then(function(transactions){
    console.log('ACCOUNT TRANSACTIONS: ');
  },
  function(reason){
    console.log('could not get transactions because of: ', reason);
  });
```
###updateInstitutionLogin(institutionalLoginId, username, newPassword)
method for updating the customer's password for a login account added by the `discoverAndAddAccounts` method listed above
#####usage
```javascript
client.updateInstitutionLogin(1284060126, 'direct', 'newpassword')
  .then(function(wasSuccess){
    console.log('changed user passwords: ', wasSuccess);
  },
  function(reason){
    console.log('could not update login accounts because of: ', reason);
  });
```
###deleteAccount(account_id)
deletes an account from a customer's account list from Intuit's database
#####usage
when used alone
```javascript
client.deleteAccount(accountId)
  .then(function(){
  console.log('deleted account');
  },
  function(reason){});
```
or chained with `getCustomerAccounts`
```javascript
client.getCustomerAccounts()
  .then(function(accounts){
    return client.deleteAccount(accounts.accounts[0].accountId)
  })
  .then(function(response){
    console.log('done delete: ', response);
  },
  function(reason){
    console.log('delete failure reason: ', reason);
  });
```
###deleteCustomer()
This call deletes the currently authenticated customer.

#####usage
```javascript
client.deleteCustomer()
  .then(function(){
  console.log('deleted customer');
  },
  function(reason){});
```

##Coming Soon...Really soon
####updateAccountType(account_id)
updates the account type of an account.  This is only used when the category of an account gets categorized automatically to 'other'
####getInvestmentPositions

##Chaining Promise Methods
Since all of the methods return a promise we can chain them like the documentation for [KrisKowal's Docs on Chaining Promises](https://github.com/kriskowal/q#chaining) There are a couple of API calls that require data from a previous call, like `deleteAccount` requires the `getCustomerAccount` to be called initially because we need an `accountId` for the account we want to delete. This is where chaining promises comes in handy.  If I were to implement the above example, where I need to get the `accountId` on a specific account I want to delete I need to first call:

```javascript
client.getCustomerAccounts()
  .then(function(accounts){
    return client.deleteAccount(accounts.accounts[0].accountId)
  })
  .then(function(response){
    console.log('done delete: ', response);
  },
  function(reason){
    console.log('delete failure reason: ', reason);
  });
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
    return client.deleteAccount(accounts.accounts[0].accountId)
  })
  .then(function(response){
    console.log('done delete: ', response);
  },
  function(reason){
    console.log('delete failure reason: ', reason);
  });


```

