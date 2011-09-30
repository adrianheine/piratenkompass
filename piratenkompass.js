var wiki = require('./wiki_mock'),
    kompass = require('./kompass'),
    lib = require('./lib');

function getKompassdata(ncb_callback) {
    wiki.getUsersInCat(function (users) {
        // FIXME move to wiki
        var uname = /^([^\/]+)/;
        users = users.map(function (u) {
            return u.match(uname)[1];
        }).filter(lib.o(lib.not, kompass.is_blacklisted));

        users = lib.uniq(users);

        lib.Do.map(users, function (item, dcb_callback, deb_errback) {
            kompass.get_kompass(function (user, ncb_callback) {
                wiki.getPage(user, function (err, page) {
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
            ncb_callback(null, result);
        }, function (err) {
            throw err;
        });
    });
}

exports.getKompassdata = getKompassdata;
