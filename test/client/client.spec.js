describe("Using the client to connect to inutiut's CAD API", function(){

  var config = require('../config');
  var Client = require('../../client/client');
  //var oauthStub = require()

  var client = new Client(config);

  var agent = require('supertest');
  var expect = require('chai').expect;

  describe('making api calls using client', function(){

    it('should get Institutions', function(done){

      done();

    });

    it('should be verifiable', function(done){

      done();
    });

  });

  describe('creating credentials object', function(){

    it('should return correct credentials objects', function(done){
      var creds = client.buildCredentials();

      expect(creds).to.exist;

      done();


    });


  })
  describe('making request to intuit oauth server', function(){

    //it('should get all institutions (getInstitutions)', function(done){
    //
    //  client.institutions()
    //    .then(function(institutions){
    //      expect(institutions).to.exist;
    //      done();
    //    });
    //});

  })

  //describe('Making the OAuth request for assertion message', function(){
  //
  //  it('should return a auth token and auth secret', function(done){
  //
  //  });
  //
  //  it('should parse the saml response body and create an oauth object containing token and secret', function(done){
  //
  //  });
  //
  //
  //})

});