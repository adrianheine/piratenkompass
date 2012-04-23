"use strict";

var should = require('should');
var lib = require('../lib');

describe('numSort', function () {
  it('should sort numbers by numeric value, ascending', function () {
    should.deepEqual(lib.numSort([1, -4.5, 2, 3, -5, 0, 5, 20, 0.2, 9]),
               [-5, -4.5, 0, 0.2, 1, 2, 3, 5, 9, 20]);
  });

  it('should gracefully handle an empty argument', function () {
    should.deepEqual(lib.numSort([]), []);
  });
});

describe('untilValue', function () {
  it('should return a found value which is the first', function (done) {
    lib.untilValue([
      1, 5
    ], function (val, ncbValHandled) {
      ncbValHandled(val === 5, val === 1 ? (val * 2) : undefined);
    }, function (errs, res) {
      should.not.exist(errs);
      res.should.eql(2);
      done();
    });
  });

  it('should return a found value which is not the first', function (done) {
    lib.untilValue([
      1, 5
    ], function (val, ncbValHandled) {
      ncbValHandled(val === 1, val === 5 ? (val * 2) : undefined);
    }, function (errs, res) {
      should.not.exist(errs);
      res.should.eql(10);
      done();
    });
  });

  it('should return errors if no value found', function (done) {
    lib.untilValue([
      1, 5
    ], function (val, ncbValHandled) {
      ncbValHandled(val * 2);
    }, function (errs, res) {
      should.exist(errs);
      errs.should.eql([2, 10]);
      done();
    });
  });
});
