//describe("Using the client to connect to inutiut's CAD API", function () {
//
//  var config = require('../config')
//
//  var IntuitAuth = new IntuiAuth(config);
//  var agent = require('supertest');
//  var expect = require('chai').expect;
//
//  describe("creating the saml assertion message", function () {
//
//    it("should create a valid saml assertion message (according to intuit's API docs)", function (done) {
//      var samlMessage = IntuitAuth.createSamlAssertion();
//
//      expect(samlMessage).to.exist;
//
//    });
//
//    it('should be verifiable', function(done){
//
//    });
//
//  })
//
//  //describe('Making the OAuth request for assertion message', function(){
//  //
//  //  it('should return a auth token and auth secret', function(done){
//  //
//  //  });
//  //
//  //  it('should parse the saml response body and create an oauth object containing token and secret', function(done){
//  //
//  //  });
//  //
//  //
//  //})
//
//});