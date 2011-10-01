var exports = module.exports = require('./underscore/underscore-min.js');

exports.Do = require('do');

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
