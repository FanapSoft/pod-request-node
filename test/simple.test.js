// External Modules
const expect = require('chai').expect;

// Project Modules
const PodRequest = require('../lib/main');
const errors = require('../lib/config').errors;

// Variable Initialization
let podRequest = new PodRequest();

describe('Just Call A Pod API', function () {
  this.timeout(10000);
  it('correct request', function (done) {
    podRequest.request('http://sandbox.pod.land/srv/basic-platform/', '/nzh/guildList', 'GET', {
      _token_: '2ffa86c3775e4883b4033269a5d18166',
      _token_issuer_: '1'
    }, { offset: '1', size: '300' })
      .then(function (result) {
        expect(result).to.have.property('hasError', false);
        expect(result).to.have.property('result');
        done();
      })
      .catch(function () {
        done(new Error());
      });
  });

  it('incorrect request (Token is removed)', function (done) {
    podRequest.request('http://sandbox.pod.land/srv/basic-platform/', '/nzh/guildList', 'GET', { _token_issuer_: '1' }, {
      offset: '1',
      size: '300'
    })
      .then(function () {
        done(new Error());
      })
      .catch(function (error) {
        // console.log(error);
        // console.log(error.code, error.message);
        expect(error).to.have.property('code', 21);
        done();
      });
  });

  it('incorrect request (Connection Error)', function (done) {
    podRequest.request('http://sandbox125.pod.land/srv/basic-platform/', '/nzh/guildList', 'GET', { _token_issuer_: '1' }, {
      offset: '1',
      size: '300'
    })
      .then(function () {
        done(new Error());
      })
      .catch(function (error) {
        // console.log(error);
        // console.log(error.code, error.message);
        expect(error).to.have.property('code', errors.connection.code);
        done();
      });
  });

  it('incorrect request (Server Error)', function (done) {
    podRequest.request('http://sandbox.pod.land/srv/basic-platform/', '/nzh/guildList100', 'GET', { _token_issuer_: '1' }, {
      offset: '1',
      size: '300'
    })
      .then(function () {
        done(new Error());
      })
      .catch(function (error) {        
        // console.log(error);
        // console.log(error.code, error.message);
        expect(error).to.have.property('code', 500);
        done();
      });
  });
});
