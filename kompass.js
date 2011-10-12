/**
 * Abstract kompass functionality
 */

var lib = require('./lib.js'),

    blacklist = ['Mms', 'Mr. Modding', 'LordSnow', 'Eduba', 'Bernd der pirat',
           'Zwergenpaladin', // 2010-12-31: -10,-10
           'ThomasDL',       // 2010-12-31: 0,0
           'Triplem',        // 2010-12-31
           'Smokerle',       // 2010-12-31: 0,0
           'Jhartmann',      // 2010-12-31: -10,-10
           'Salpeterer',     // 2010-12-31: 0,0
           'Reeder',         // 2010-12-31: 0,0
           'Reaver',         // 2010-12-31: 0,0
           'East',           // 2010-12-31: 0,0
           'Pradetto'        // 2010-12-31: 0,0
          ],
    static_kompass = {
        'Acamir'     : {ec: -0.6, soc: -5.1},
        'B.pwned'    : {ec: -4.8, soc: -5.8},
        'DimMyPrp'   : {ec: -5.8, soc: -3.8},
        'Just-Ben'   : {ec: -5.5, soc: -5.6},
        'MönchA'     : {ec: -3.7, soc: -7.3},
        'Medelmann'  : {ec: -6.8, soc: -6.5},
        'Onineko'    : {ec: -5.3, soc: -6.3}, //2010-12-31
        'Petalor'    : {ec: -6.8, soc: -6.5}, //2010-12-31
        'Snake D'    : {ec: -5.5, soc: -2.9}, //2010-12-31
        'Transhuman' : {ec: -7.1, soc: -5.2}, //2010-12-31
        'ValiDOM'    : {ec: -3.5, soc: -2.8}, //2010-12-31
        'Vampi'      : {ec: -4.7, soc: -8.1}
    },

    parse_regex = /(?:pc_)?(ec|soc)\s*=\s*([-+]?\s*[\d.]+)/ig;

function is_blacklisted(user) {
    return blacklist.indexOf(user) !== -1;
}

function get_kompass(kompass_getters, user, ncb_kompasshandler) {
    var add_getter;

    // For single getter
    if (typeof kompass_getters === 'function') {
        kompass_getters = [kompass_getters];
    }

    // Prepend default getter
    kompass_getters = [get_static_kompass].concat(kompass_getters);

    add_getter = kompass_getters.push.bind(kompass_getters);

    lib.untilValue(kompass_getters, function (getter, callback) {
        getter(user, add_getter, callback);
    }, function (errs, res) {
        if (errs) {
            console.warn('Failed to get compass data for ' + user + ' (' + errs.map(function (v) { return '"' + v + '"'; }).join(',') + ')');
            errs = 'Failed to get compass data for ' + user;
        }
        ncb_kompasshandler(errs, res);
    });
}

/**
 * Default callback for static lookup
 */
function get_static_kompass(u, addGetter, ncb_callback) {
    ncb_callback(null, static_kompass[u] || null);
}

function parse_page(page, ncb_callback) {
    var ret = {}, match;
    while( match = parse_regex.exec(page)) {
        ret[match[1].toLowerCase()] = parseFloat(match[2].replace(' ', ''));
    }
    ncb_callback(null, ('ec' in ret && 'soc' in ret) ? ret : null);
}

exports.is_blacklisted = is_blacklisted;
exports.get_kompass = get_kompass;
exports.parse_page = parse_page;
