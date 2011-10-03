var wiki = require('./wiki_mock'),
    kompass = require('./kompass'),
    lib = require('./lib'),
    async = require('async');

function getKompassdata(ncb_callback) {
    wiki.getUsersInCat(function (users, ncb_register_done) {
        users = users.filter(lib.o(lib.not, kompass.is_blacklisted));

        // Retrieve compasses for users
        async.map(users, function (item, ncb_callback) {
            kompass.get_kompass(function (user, ncb_callback) {
                async.waterfall([
                    wiki.getUserPage.bind(undefined, user),
                    kompass.parse_page
                ], ncb_callback);
            }, item, function (err, val) {
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
