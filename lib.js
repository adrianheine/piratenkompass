"use strict";

var lib = module.exports = require('underscore'),
  async = require('async');

/**
 * Construct a function which calls a specific method on it’s first parameter
 *
 * This is similar to Scala’s very concise, underscore-powered function
 * literals:
 *   col.map(_.toString) -> col.map(lib.fn_('toString'))
 */
lib.fn_ = function (method/*, ... */) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function (obj) {
    return obj[method].apply(obj, args);
  };
};

lib.mapValues = function (inp, mapper) {
  return lib.reduce(inp, function (obj, v, k) {
    obj[k] = mapper(v, k);
    return obj;
  }, {});
};

lib.flattenOnce = function (inp) {
  var _ret = [];
  return _ret.concat.apply(_ret, inp);
};

lib.not = function (a) {
  return !a;
};

lib.minus = function (a, b) {
  return a - b;
};

lib.plus = function (a, b) {
  return a + b;
};

function firstHandler(handlers, test_func) {
  var res = null;
  handlers.some(function () {
    res = test_func.apply(this, Array.slice(arguments));
    return res;
  });
  return res;
}

lib.ncb_withRes = function (cb_reshandler, ncb_continue) {
  return function (err, res) {
    if (typeof res !== 'undefined') {
      res = cb_reshandler(res);
    }
    ncb_continue(err, res);
  };
};

lib.ncb_withErr = function (cb_errhandler, ncb_continue) {
  return function (err, res) {
    if (typeof err !== 'undefined' && err !== null) {
      err = cb_errhandler(err);
    }
    ncb_continue(err, res);
  };
};

lib.iterativeParallel = function (taskhandler, ncb_finishhandler, start_state) {
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

lib.numForOutput = function (v) {
  return Number.prototype.toFixed.call(v, 2);
};

lib.numSort = lib.fn_('sort', lib.minus);

/**
 * An asynchronous forEach stopping after the first iterator call yielding a
 * result. Returns the result of the iterator (as res) or an array containing
 * all errors received (as err), if no iterator yielded a value.
 */
lib.untilValue = function (arr, iterator, ncb_callback) {
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

lib.retry = function (fn, delay, retries, ncb_callback) {
  var last_err = null;

  ncb_callback = arguments[arguments.length - 1];
  if (typeof delay !== 'number') {
    delay = 1000;
  }
  if (typeof retries !== 'number') {
    retries = 5;
  }

  async.whilst(function () {
    return retries-- > 0;
  }, function (callback) {
    fn(function (err, res) {
      if (err) {
        last_err = err;
        setTimeout(callback, delay);
      } else {
        ncb_callback(null, res);
      }
    });
  }, function () {
    ncb_callback(last_err || 'Maximum number of retries reached');
  });

};

lib.simpleTime = function (str) {
  var val, match,
    mapping = [
      {unit: 's', amount:  1},
      {unit: 'm', amount: 60},
      {unit: 'h', amount: 60},
      {unit: 'd', amount: 24},
      {unit: 'w', amount:  7}
    ];
  if (typeof str === 'number') {
    return str;
  }
  match = str.match(/^(-?[\d.]+)(\w)?$/);
  val = parseFloat(match[1]);
  if (match[2]) {
    lib.some(mapping, function (v) {
      val *= v.amount;
      if (v.unit === match[2]) {
        return true;
      }
    });
  }
  return val;
};

lib.cached = function (val_producer, expiry) {
  var value = null,
    valid_until = null;

  if (typeof expiry === 'undefined') {
    expiry = '1d';
  }
  expiry = lib.simpleTime(expiry);

  return function (ncb_val_handler) {
    if (valid_until === null || valid_until < Date.now()) {
      val_producer(lib.ncb_withRes(function (res) {
        value = res;
        valid_until = Date.now() + expiry;
        return res;
      }, ncb_val_handler));
    } else {
      ncb_val_handler(null, value);
    }
  };
};

lib.reduceMatches = function (regex, target, matchHandler, memo) {
  var match;
  while (match = regex.exec(target)) {
    memo = matchHandler(memo, match);
  }
  return memo;
};
