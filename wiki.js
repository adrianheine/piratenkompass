"use strict";
var http = require('http'),
    lib = require('./lib'),
    host = 'wiki.piratenpartei.de',
    category = 'Benutzer hat politischen Kompass',
    ns_text = 'Benutzer:',
    ns = new RegExp('^' + ns_text);

function getRes(path, ncb) {
    http.get({host: host,
              headers: {Connection: 'keep-alive'},
              path: path},
             function (res) {
                 var data = '';
                 res.on('data', function (chunk) { data += chunk; })
                    .on('end', function () { ncb(null, data); });
             })
         .on('error',
             function (e) {
                 console.log("Got error: " + e.message);
                 setTimeout(getRes.bind(undefined, path, ncb), 1000);
             });
}

function getCatMembers(cb_datahandler, ncb_finishhandler) {
    var expect = [], res = [];

    function ncb_register_done(state, err, val) {
        if (err) {
            return ncb_finishhandler(err);
        }

        res.push(val);
        expect = lib.without(expect, state);
        if (expect.length === 0) {
            return ncb_finishhandler(null, lib.flattenOnce(res));
        }
    }

    function _getCatMembers(state) {
        state = state || '';

        expect.push(state);
        getRes('/wiki/api.php?action=query'
                          + '&list=categorymembers'
                          + '&cmtitle=Category:' + encodeURIComponent(category)
                          + '&format=json'
                          + '&cmlimit=max'
                          + '&cmcontinue=' + encodeURIComponent(state),
                function (err, data) {
                    var content = JSON.parse(data);
                    if (content['query-continue']) {
                        _getCatMembers(content['query-continue'].categorymembers.cmcontinue);
                    }
                    cb_datahandler(content.query.categorymembers,
                                   ncb_register_done.bind(undefined, state));
                });
    }

    _getCatMembers();
}

function getPage(page, ncb) {
    getRes('/' + encodeURIComponent(page) + '?action=raw',
           ncb);
}

function getUsersInCat(cb_datahandler, ncb_finishhandler) {
    getCatMembers(function (members, ncb_register_done) {
                     cb_datahandler(members.filter(function (item) { return item.ns === 2; })
                                           .map(function (item) { return item.title.replace(ns, ''); }),
                                    ncb_register_done);
                  }, ncb_finishhandler);
}

function getUserPageURL(user) {
    return 'http://' + host + '/wiki/' + encodeURIComponent(ns_text + user);
}

exports.getUserPage = function (user, ncb) {
    return getPage(ns_text + user, ncb);
}

exports.getUsersInCat = getUsersInCat;
exports.getPage = getPage;
exports.getUserPageURL = getUserPageURL;
