/**
 * Abstract kompass functionality
 */

"use strict";

var lib = require('./lib.js'),

    parse_regex = /(?:pc_)?(ec|soc)\s*=\s*([\-+]?\s*[\d.]+)/ig;

function get_kompass(kompass_getters, user, ncb_kompasshandler) {
    lib.untilValue(kompass_getters, function (getter, ncb_callback) {
        getter(user, ncb_callback);
    }, lib.ncb_withErr(function (errs) {
        console.warn('Failed to get compass data for ' + user + ':\n' +
                     errs.map(function (v) { return "  - " + v; }).join('\n'));
        return 'Failed to get compass data for ' + user;
    }, ncb_kompasshandler));
}

function parse_page(page, ncb_callback) {
    var ret = {}, match;
    while (match = parse_regex.exec(page)) {
        ret[match[1].toLowerCase()] = parseFloat(match[2].replace(' ', ''));
    }
    try {
        ret = new exports.Compass(ret.ec, ret.soc);
    } catch (e) {
        return ncb_callback(e);
    }
    ncb_callback(null, ret);
}

exports.get_kompass = get_kompass;
exports.parse_page = parse_page;

exports.Compass = function (ec, soc) {
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
};

exports.Compass.prototype.toString = function () {
    var _this = this;
    return '(' + ['ec', 'soc'].map(function (k) {
        return k + ': ' + (typeof _this[k] === 'number' ? lib.numForOutput(_this[k]) : _this[k]);
    }).join(', ') + ')';
};
