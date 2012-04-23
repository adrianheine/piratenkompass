"use strict";

var should = require('should');

var compass = require('../compass');

describe('Compass', function () {
  describe('getCompass', function () {
    it('returns the first compass it finds', function (done) {
      compass.getCompass([
        function (user, ncbGotCompass) {
          ncbGotCompass(null, 'First compass');
        },
        function (user, ncbGotCompass) {
          ncbGotCompass(null, 'Second compass');
        },
      ], 'User', function (err, res) {
        should.not.exist(err);
        should.exist(res);
        res.should.eql('First compass');
        done();
      });
    });
  });

  describe('parsePage', function () {
    it('parses MediaWiki template syntax', function (done) {
      compass.parsePage('{{template_name' +
        '| pc_soc = 5.00' +
        '| pc_ec = 4.00' +
        '}}', function (err, res) {
        should.not.exist(err);
        should.exist(res);
        res.soc.should.eql(5);
        res.ec.should.eql(4);
        done();
      });
    });
  });

  describe('Compass', function () {
    it('rejects boring compasses', function () {
      var ret;
      try {
        ret = new compass.Compass(0, 0);
      } catch (e) {
        e.should.eql('Boring compass (ec: 0.00, soc: 0.00)');
      }
      should.not.exist(ret);
    });

    it('only works when called as a constructor', function () {
      var ret;
      try {
        ret = compass.Compass(0, 0);
      } catch (e) {

      }
      should.not.exist(ret);
    });
  });
});
