"use strict";
var http = require('http'),
    host = 'wiki.piratenpartei.de',
    category = 'Benutzer hat politischen Kompass',
    ns_text = 'Benutzer:',
    ns = new RegExp('/^' + ns_text + '/');

function getRes(path, cb) {
    http.get({host: host,
              headers: {Connection: 'keep-alive'},
              path: path},
             function (res) {
                 var data = '';
                 res.on('data', function (chunk) { data += chunk; })
                    .on('end', cb.bind(undefined, data));
             })
         .on('error',
             function (e) {
                 console.log("Got error: " + e.message);
                 setTimeout(getRes.bind(undefined, path, cb), 1000);
             });
}

function getCatMembers(ncb_datahandler) {
    function _getCatMembers(state) {
        state = state || '';

        getRes('/wiki/api.php?action=query'
                          + '&list=categorymembers'
                          + '&cmtitle=Category:' + encodeURIComponent(category)
                          + '&format=json'
                          + '&cmlimit=max'
                          + '&cmcontinue=' + encodeURIComponent(state),
                function (data) {
                    var content = JSON.parse(data);
                    if (content['query-continue']) {
                        _getCatMembers(content['query-continue'].categorymembers.cmcontinue);
                    }
                    ncb_datahandler(content.query.categorymembers);
                });
    }

    _getCatMembers();
}

function getPage(cb, page) {
    getRes('/wiki/index.php?title=' + encodeURIComponent(page) + '&action=raw',
           cb);
}

function getUsersInCat(cb) {
    getCatMembers(function (members) {
                     cb(members.filter(function (item) { return item.ns === 2; })
                               .map(function (item) { return item.title.replace(ns, ''); }));
                  });
}

function getUserPageURL(user) {
    return 'http://' + host + '/wiki/' + encodeURIComponent(ns_text + user);
}

exports.getUsersInCat = getUsersInCat;
exports.getPage = getPage;
exports.getUserPageURL = getUserPageURL;
