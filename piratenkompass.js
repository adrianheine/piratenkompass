/*jslint white:true*/
"use strict";

var wiki = require('./wiki'),
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

    getCompass = (function () {
        var userPageGetter = (function () {
            var getters = [];
            return function (user) {
                if (!getters[user]) {
                    getters[user] = lib.cached(wiki.getUserPage.bind(undefined, user),
                                               '10m');
                }
                return getters[user];
            };
        }()),

        def_getters = [
            // Check static compass data
            function (u, ncb_callback) {
                var compass = static_kompass[u];
                if (!compass) {
                    return ncb_callback('No static compass data available');
                }
                try {
                    compass = new kompass.Compass(compass.ec, compass.soc);
                } catch (e) {
                    return ncb_callback('Static compass data is bad: ' + e);
                }
                ncb_callback(null, compass);
            },

            // Parse user page for compass data
            function (user, ncb_callback) {
                async.waterfall([
                    userPageGetter(user),
                    kompass.parse_page
                ], lib.ncb_withErr(function (err) {
                    return 'User page contains bad compass: ' + err;
                }, ncb_callback));
            },
            // Parse included pages
            function (user, ncb_callback, getters) {
                async.waterfall([
                    userPageGetter(user),
                    function (page, ncb_callback) {
                        wiki.getIncludedPageNames(page).forEach(function (v) {
                            getters.push(function (user, ncb_callback) {
                                async.waterfall([
                                    wiki.getPage.bind(undefined, v),
                                    kompass.parse_page
                                ], lib.ncb_withErr(function (err) {
                                    return 'Included page ' + v + ' contains bad compass: ' + err;
                                }, ncb_callback));
                            });
                        });
                        ncb_callback();
                    }
                ], ncb_callback);
            }
        ];

        return function (user, ncb_compasshandler) {
            // Build a new getters array on each run.
            kompass.get_kompass(def_getters.slice(0), user, ncb_compasshandler);
        };
    }()),

    compasses = (function () {
        var timeouts = {};

        return Object.create({
            add: function (user) {
                var getter = getCompass.bind(undefined, user, function (err, val) {
                    if(!compasses.hasOwnProperty(user)) {
                        console.err('getCompass called for ' + user +
                                    ', a user without compass');
                        return;
                    }
                    var ret = {name: user};
                    if (err) {
                        ret.error = true;
                    } else {
                        ret.compass = val;
                    }
                    timeouts[user] = setTimeout(getter,
                                                lib.simpleTime((5 + Math.random() * 4).toString() + 'd') * 1000);
                    compasses[user] = ret;
                });

                this[user] = {name: user, not_init: true};
                getter();
            },

            remove: function (user) {
                clearTimeout(timeouts[user]);
                delete this[user];
            }
        });
    }());

// Get users from category
process.nextTick(function getUsers() {
    wiki.getUsersInCat(function (users, ncb_register_done) {
        users = lib.difference(users, blacklist);
        ncb_register_done(null, users);
    }, function (err, res) {
        if (err) {
            console.log('Error while getting users from cat: ' + err);
            setTimeout(getUsers, 0);
            return;
        }

        var cur_users = lib.uniq(lib.flatten(res)),
            old_users = lib.keys(compasses);

        // Remove users who had a compass, but have none now
        lib.difference(old_users, cur_users).forEach(compasses.remove.bind(compasses));

        // Add new users
        lib.difference(cur_users, old_users).forEach(compasses.add.bind(compasses));

        setTimeout(getUsers, lib.simpleTime('1d') * 1000);
    });
});

exports.getKompassdata = function (ncb_callback) {
    ncb_callback(null, compasses);
};
