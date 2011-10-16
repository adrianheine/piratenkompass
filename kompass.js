/**
 * Abstract kompass functionality
 */

var lib = require('./lib.js'),

    parse_regex = /(?:pc_)?(ec|soc)\s*=\s*([-+]?\s*[\d.]+)/ig;

function get_kompass(kompass_getters, user, ncb_kompasshandler) {
    lib.untilValue(kompass_getters, function (getter, ncb_callback) {
        getter(user, function (err, res) {
            var reject = false;
            if (res) {
                if ([-10, 0, 10].indexOf(res.ec) !== -1 &&
                    [-10, 0, 10].indexOf(res.soc) !== -1) {
                    reject = 'boring';
                } else if (res.ec < -10 || res.ec > 10 || res.soc < -10 || res.ec > 10) {
                    reject = 'out-of-range';
                }
                if (reject) {
                    err = 'Rejecting ' + user + '’s ' + reject + ' compass ' +
                          '(ec: ' + lib.numForOutput(res.ec) + ' – ' +
                          'soc: ' + lib.numForOutput(res.soc) + ')';
                    res = null;
                }
            }
            ncb_callback(err, res);
        });
    }, function (errs, res) {
        if (errs) {
            console.warn('Failed to get compass data for ' + user + ':\n' + errs.map(function (v) { return "  - " + v; }).join('\n'));
            errs = 'Failed to get compass data for ' + user;
        }
        ncb_kompasshandler(errs, res);
    });
}

function parse_page(page, ncb_callback) {
    var ret = {}, match;
    while( match = parse_regex.exec(page)) {
        ret[match[1].toLowerCase()] = parseFloat(match[2].replace(' ', ''));
    }
    ncb_callback(null, ('ec' in ret && 'soc' in ret) ? ret : null);
}

exports.get_kompass = get_kompass;
exports.parse_page = parse_page;
