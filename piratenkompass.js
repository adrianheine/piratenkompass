var wiki = require('./wiki_mock'),
    kompass = require('./kompass'),
    lib = require('./lib'),
    async = require('async');

function getKompassdata(ncb_callback) {
    wiki.getUsersInCat(function (users, ncb_register_done) {
        users = users.filter(lib.o(lib.not, kompass.is_blacklisted));

        // Retrieve compasses for users
        async.map(users, function (item, ncb_callback) {
            var getters = [
                // Parse user page for compass data
                function (user, ncb_callback) {
                    async.waterfall([
                        wiki.getUserPage.bind(undefined, user),
                        kompass.parse_page
                    ], ncb_callback);
                },
                // Parse included pages
                function (user, ncb_callback) {
                    async.waterfall([
                        wiki.getUserPage.bind(undefined, user),
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

            kompass.get_kompass(getters, item, function (err, val) {
                var ret = {name: item};
                if (err) {
                    ret.error = true;
                } else {
                    ret.compass = val;
                }
                ncb_callback(null, ret);
            });
        }, ncb_register_done);
    }, ncb_callback);
}

exports.getKompassdata = getKompassdata;
