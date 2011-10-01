var wiki = require('./wiki'),
    kompass = require('./kompass'),
    lib = require('./lib');

function getKompassdata(ncb_callback) {
    wiki.getUsersInCat(function (users, ncb_register_done) {
        // FIXME move to wiki
        var uname = /^([^\/]+)/;
        users = users.map(function (u) {
            return u.match(uname)[1];
        }).filter(lib.o(lib.not, kompass.is_blacklisted));

        users = lib.uniq(users);

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
                return dcb_callback({name: item, compass: val || err});
            });
        })(function (result) {
            ncb_register_done(null, result);
        }, function (err) {
            ncb_register_done(err);
        });
    }, ncb_callback);
}

exports.getKompassdata = getKompassdata;
