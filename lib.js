var exports = module.exports = require('./underscore/underscore-min.js'),
    async = require('async'),
    lib = exports;

exports.mapValues = function (inp, mapper) {
    return exports.reduce(inp, function (obj, v, k) {
            obj[k] = mapper(v, k);
            return obj;
        }, {});
};

exports.flattenOnce = function (inp) {
    var _ret = [];
    return _ret.concat.apply(_ret, inp);
};

function o(a, b) {
    return function () {
        return a(b.apply(this, arguments));
    };
}

function not(a) {
    return !a;
}

function firstHandler(handlers, test_func) {
    var res = null;
    handlers.some(function () {
        res = test_func.apply(this, Array.slice(arguments));
        return res;
    });
    return res;
}

exports.o = o;
exports.not = not;

exports.iterativeParallel = function (taskhandler, ncb_finishhandler, start_state) {
    var expect = [], overall_res = [];

    function ncb_register_done(state, err, res) {
        if (err) {
            return ncb_finishhandler(err);
        }

        overall_res.push(res);
        expect = lib.without(expect, state);
        if (expect.length === 0) {
            return ncb_finishhandler(null, overall_res);
        }
    }

    function start_task(state) {
        expect.push(state);

        return taskhandler(state, start_task,
                           ncb_register_done.bind(null, state));
    }

    start_task(start_state);
};

exports.numForOutput = function (v) {
    return Number.prototype.toFixed.call(v, 2);
};

exports.numSort = function (list) {
    return list.sort(function (a, b) {
        return a < b ? -1 : (a > b ? 1 : 0);
    });
};

/**
 * An asynchronous forEach stopping after the first iterator call yielding a
 * result. Returns the result of the iterator (as res) or an array containing
 * all errors received (as err), if no iterator yielded a value.
 */
exports.untilValue = function (arr, iterator, ncb_callback) {
    var errs = [];
    return async.forEachSeries(arr, function (item, callback) {
        iterator(item, function (err, res) {
            if (res) {
                // Trigger series aborting
                callback(res);
            } else {
                if (err) {
                    errs.push(err);
                }
                callback();
            }
        });
    }, function (res) {
        if (res) {
            ncb_callback(null, res);
        } else {
            ncb_callback(errs);
        }
    });
};
