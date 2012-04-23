/**
 * Abstract compass functionality
 */

"use strict";

var lib = require('./lib');
var parseRegex = /(?:pc_)?(ec|soc)\s*=\s*([\-+]?\s*[\d.]+)/ig;

var compass = module.exports = {
  getCompass: function (getters, user, ncbCompassHandler) {
    lib.untilValue(getters, function (getter, ncbCallback) {
      getter(user, ncbCallback, getters);
    }, lib.ncb_withErr(function (errs) {
      console.warn('Failed to get compass data for ' + user + ':\n' +
        errs.map(lib.plus.bind(lib, "  - ")).join('\n'));
      return 'Failed to get compass data for ' + user;
    }, ncbCompassHandler));
  },

  parsePage: function (pageContent, ncbPageParsed) {
    var ret = lib.reduceMatches(parseRegex, pageContent, function (ret, match) {
      ret[match[1].toLowerCase()] = parseFloat(match[2].replace(/ /g, ''));
      return ret;
    }, {});

    try {
      ret = new compass.Compass(ret.ec, ret.soc);
    } catch (e) {
      return ncbPageParsed(e);
    }
    ncbPageParsed(null, ret);
  },

  Compass: function (ec, soc) {
    if (!this || this === compass) {
      throw 'Compass called without new operator';
    }

    // Set early to get nice string representations
    this.ec = ec;
    this.soc = soc;

    if (typeof ec !== 'number' || typeof soc !== 'number') {
      throw 'Invalid compass ' + this.toString();
    }

    if ([-10, 0, 10].indexOf(ec) !== -1 && [-10, 0, 10].indexOf(soc) !== -1) {
      throw 'Boring compass ' + this.toString();
    }

    if (ec < -10 || ec > 10 || soc < -10 || ec > 10) {
      throw 'Out-of-range compass ' + this.toString();
    }
  }
};

compass.Compass.prototype.toString = function () {
  var _this = this;
  return '(' + ['ec', 'soc'].map(function (k) {
    return k + ': ' +
      (typeof _this[k] === 'number' ? lib.numForOutput(_this[k]) : _this[k]);
  }).join(', ') + ')';
};
