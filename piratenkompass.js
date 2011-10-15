var wiki = require('./wiki_mock'),
    kompass = require('./kompass'),
    lib = require('./lib'),
    async = require('async'),

getUsers = lib.cached(function (ncb_callback) {
    wiki.getUsersInCat(function (users, ncb_register_done) {
        users = users.filter(lib.compose(lib.not, kompass.is_blacklisted));
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
}());

getCompass = function (user, ncb_callback) {
    if (!getCompass.getters[user]) {
        getCompass.getters[user] = lib.cached(function (ncb_callback) {
            // Retrieve compass for user
            var getters = [
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
    getCompass.getters[user](ncb_callback);
};

getCompass.getters = {};

exports.getKompassdata = lib.cached(function (ncb_datahandler) {
    async.waterfall([
        getUsers,
        function (users, ncb_callback) {
            async.map(users, getCompass, ncb_callback);
        }
    ], ncb_datahandler);
});
