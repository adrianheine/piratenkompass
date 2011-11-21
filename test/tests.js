"use strict";

var lib = require("lib");

exports.numSort = function (beforeExit, assert) {
    assert.deepEqual(lib.numSort([1, -4.5, 2, 3, -5, 0, 5, 20, 0.2, 9]),
                     [-5, -4.5, 0, 0.2, 1, 2, 3, 5, 9, 20]);
};

/*
exports. = function (beforeExit, assert) {
    assert.equal(, );
};
*/
