var wiki = require('./wiki_mock'),
    kompass = require('./kompass'),
    lib = require('./lib');

function getKompassdata(ncb_callback) {
    wiki.getUsersInCat(function (users, ncb_register_done) {
        users = users.filter(lib.o(lib.not, kompass.is_blacklisted));

        lib.Do.map(users, function (item, dcb_callback, deb_errback) {
            kompass.get_kompass(function (user, ncb_callback) {
                wiki.getUserPage(user, function (err, page) {
                    if (err) {
                        ncb_callback(err);
                    } else {
                        kompass.parse_page(page, ncb_callback);
                    }
                });
            }, item, function (err, val) {
                var ret = {name: item};
                if (err) {
                    ret.error = true;
                } else {
                    ret.compass = val;
                }
                return dcb_callback(ret);
            });
        })(function (result) {
            ncb_register_done(null, result);
        }, function (err) {
            ncb_register_done(err);
        });
    }, ncb_callback);
}

exports.getKompassdata = getKompassdata;
