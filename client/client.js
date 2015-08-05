var q = require('q');
var request = require('request');
var async = require('async');

var IntuitAuth = require('../intuitcad/intuit-auth');

var BASE_URL = 'https://financialdatafeed.platform.intuit.com/v1';


var Client = function(authCreds){

  this.authCreds = authCreds;
  this.intuitAuth = new IntuitAuth(authCreds);
};

Client.prototype = {

  institutions: function(){

    var deferred = q.defer();

    this.get('/institutions')
      .then(function(){

      });

    return deferred.promise;
  },

  institutionDetails: function(id){

    var deferred = q.defer();

    this.get('/institutions/' + id)
      .then(function(details){
        deferred.resolve(details);
      })

    return deferred.promise;
  },
  discoverAndAddAccounts: function(username, password, institutionId){

    var deferred = q.defer();

    var creds = this.buildCredentials(username, password);

    this.post('/institutions/' + institutionId + '/logins', creds)
      .then(function(response){
        deferred.resolve(response);
      });

    return deferred.promise;
  },

  getCustomerAccounts: function(){

    var deferred = q.defer();

    this.get('/accounts')
      .then(function(accounts){
        deferred.resolve(accounts);
      },
      function(reason){
        console.log('could not get customer accounts because: ', reason);
        deferred.reject(reason);
      });

    return deferred.promise;
  },

  getLoginAccounts: function(institutionLoginId){

    var deferred = q.defer();

    this.get('/logins/' + institutionLoginId + '/accounts')
      .then(function(loginAccounts){
        deferred.resolve(loginAccounts);
      },
      function(reason){
        deferred.reject(reason);
      })

    return deferred.promise;
  },
  getAccount: function(accountId){

    var deferred = q.defer();

    this.get('/accounts/' + accountId)
      .then(function(accountDetail){
        deferred.resolve(accountDetail);
      },
      function(reason){
        deferred.reject(reason);
      });

    return deferred.promise;

  },
  getAccountTransactions: function(accountId, txnStartDate, txnEndDate){

    var deferred = q.defer(),
      txnDates = {txnStartDate: txnStartDate, txnEndDate: txnEndDate};

    this.get('/accounts/' + accountId + '/transactions/', txnDates)
      .then(function(transactions){
        deferred.resolve(transactions);
      },
      function(reason){
        deferred.reject(reason);
      })

    return deferred.promise;
  },
  updateInstitutionLogin: function(institutionalLoginId, username, newPassword){

    var deferred = q.defer();

    var newCreds = this.buildCredentials(username, newPassword);

    this.put('/logins/'+institutionalLoginId+'?refresh=true', newCreds)
      .then(function(wasChanged){
        deferred.resolve(wasChanged);
      },
      function(reason){
        deferred.reject(reason);
      });

    return deferred.promise;
  },
  updateAccountType: function(accountId, accountType){

    var deferred = q.defer();



    return deferred.promise;

  },

  deleteAccount: function(accountId){

    var deferred = q.defer();
    this.delete('/accounts/'+accountId)
      .then(function(wasDeleted){
        deferred.resolve('the account '+accountId+'was successfully deleted.');
      },
      function(reason){
        deferred.reject('the account '+accountId+'was not deleted successfully because: ', reason);
      });

    return deferred.promise;
  },
  get: function(url, queryString){

    var deferred = q.defer();

    var options = {
      method: 'GET',
      url: url,
      qs: queryString,
      headers: {'Content-Type': 'application/json'}
    };

    this.makeRequest(options)
      .then(function(response){
        deferred.resolve(response);
      },
      function(reason){
        deferred.reject(reason);
      });

    return deferred.promise;

  },

  post: function(url, creds){

    var deferred = q.defer();

    var options = {};
    options.url = url;
    options.headers = {'Content-Type': 'application/json'};
    options.body = creds;
    options.method = 'POST';

    this.makeRequest(options)
      .then(function(response){
        deferred.resolve(response);
      },
      function(reason){
        deferred.reject(reason);
      });

    return deferred.promise;
  },

  put: function(url, body){

    var deferred = q.defer();

    var options = {};
    options.url = url;
    options.headers = {'Content-Type': 'application/json'};
    options.body = body;
    options.method = 'PUT';

    this.makeRequest(options)
      .then(function(response){
        deferred.resolve(response);
      },
      function(reason){
        deferred.reject(reason);
      });

    return deferred.promise;

  },
  delete: function(url){

    var deferred = q.defer();
    var options = {
      url: url,
      method: 'DELETE'
    };

    this.makeRequest(options)
      .then(function(){
        deferred.resolve(true);
      },
      function(reason){
        deferred.reject(reason);
      });

    return deferred.promise;
  },
  makeRequest: function(options){

    //console.log('in make request');
    var deferred = q.defer();
    var authCreds = this.authCreds;

    this.intuitAuth.authenticate()
      .then(function(oauthObj){

        var oauth =
        {
          consumer_key: authCreds.consumerKey,
          consumer_secret: authCreds.consumerSecret,
          token: oauthObj.token,
          token_secret: oauthObj.tokenSecret
        };

        options.oauth = oauth;
        options.json = true;
        options.baseUrl = BASE_URL;

        //console.log('request options: ', options);sssss

        request(options, function(err, r, response){

          if(err)
            console.log('error:', err);

          deferred.resolve(response)
        })
      },
      function(reason){
        console.log('could not authenticate: ', reason);
        deferred.reject(reason);
      });

    return deferred.promise;
  },

  buildCredentials: function(username, password){

    var creds =
    {
      credentials: {
        credential: [{name: 'Banking Userid', value: username},
          {name: 'Banking Password', value: password}]
      }
    };

    return creds;
  },

  buildChangeAccountTypeBody: function(accountType){

    var body =
    {
      investmentAccount: {
        investmentAccountType: '401K'
      }
    }

    return body;
  }


};

module.exports = Client;

