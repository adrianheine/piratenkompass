/*jslint white:true*/
"use strict";

var wiki = require('./wiki_mock'),
    kompass = require('./kompass'),
    lib = require('./lib'),
    async = require('async'),

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

getUsers = lib.cached(function (ncb_callback) {
    wiki.getUsersInCat(function (users, ncb_register_done) {
        users = users.filter(function (user) {
            return blacklist.indexOf(user) === -1;
        });
        ncb_register_done(null, users);
    }, lib.ncb_withRes(lib.compose(lib.uniq, lib.flatten), ncb_callback));
}, '1d'),

userPageGetter = (function () {
    var getters = [];
    return function (user) {
        if (!getters[user]) {
            getters[user] = lib.cached(wiki.getUserPage.bind(undefined, user),
                                       '10m');
        }
        return getters[user];
    };
}()),

getCompass = (function () {
    var user_getters = {};
    return function (user, ncb_callback) {
        if (!user_getters[user]) {
            user_getters[user] = lib.cached(function (ncb_callback) {
                // Retrieve compass for user
                var getters = [
                    // Check static compass data
                    function (u, ncb_callback) {
                        var compass = static_kompass[u];
                        if (!compass) {
                            return ncb_callback('No static compass data available');
                        }
                        try {
                            compass = new kompass.Compass(compass.ec, compass.soc);
                        } catch (e) {
                            return ncb_callback(e);
                        }
                        ncb_callback(null, compass);
                    },

                    // Parse user page for compass data
                    function (user, ncb_callback) {
                        async.waterfall([
                            userPageGetter(user),
                            kompass.parse_page
                        ], ncb_callback);
                    },
                    // Parse included pages
                    function (user, ncb_callback) {
                        async.waterfall([
                            userPageGetter(user),
                            function (page, ncb_callback) {
                                wiki.getIncludedPageNames(page).forEach(function (v) {
                                    getters.push(function (user, ncb_callback) {
                                        async.waterfall([
                                            wiki.getPage.bind(undefined, v),
                                            kompass.parse_page
                                        ], ncb_callback);
                                    });
                                });
                                ncb_callback();
                            }
                        ], ncb_callback);
                    }
                ];

                kompass.get_kompass(getters, user, function (err, val) {
                    var ret = {name: user};
                    if (err) {
                        ret.error = true;
                    } else {
                        ret.compass = val;
                    }
                    ncb_callback(null, ret);
                });
            }, (5 + Math.random() * 5).toString() +  'd');
        }
        user_getters[user](ncb_callback);
    };
}());

exports.getKompassdata = async.waterfall.bind(undefined, [
    getUsers,
    function (users, ncb_callback) {
        async.map(users, getCompass, ncb_callback);
    }
]);
