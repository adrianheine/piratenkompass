"use strict";
var http = require('http'),
    async = require('async'),
    lib = require('./lib'),
    host = 'wiki.piratenpartei.de',
    category = 'Benutzer hat politischen Kompass',
    ns_text = 'Benutzer:',
    ns = new RegExp('^' + ns_text),
    exports = module.exports = {},
    tpl_ns = 'Vorlage:',
    wiki = exports;

exports.getRes = function (path, ncb_reshandler) {
    lib.retry(function (ncb_callback) {
        http.get({host: host, headers: {Connection: 'keep-alive'},
                  path: path}, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            }).on('end', function () {
                ncb_callback(null, data);
            });
        }).on('error', function (e) {
            console.warn("Got error: " + e.message);
            ncb_callback(e.message);
        });
    }, lib.ncb_withErr(function (err) {
        return 'Cannot load wiki resource ' + path + ', got error ' + err;
    }, ncb_reshandler));
};

exports.getCatMembers = function (cb_datahandler, ncb_finishhandler) {
    var path = '/wiki/api.php?action=query'
                          + '&list=categorymembers'
                          + '&cmtitle=' + encodeURIComponent('Category:' + category)
                          + '&format=json'
                          + '&cmlimit=max'
                          + '&cmcontinue=';

    lib.iterativeParallel(function (state, add_task, ncb_register_done) {
        wiki.getRes(path + encodeURIComponent(state), function (err, data) {
            if (err) {
                return ncb_finishhandler('Cannot get category members for ›' + category + '‹.');
            }
            var content = JSON.parse(data);

            if (content['query-continue']) {
                add_task(content['query-continue'].categorymembers.cmcontinue);
            }

            cb_datahandler(content.query.categorymembers, ncb_register_done);
        });
    }, ncb_finishhandler, '');
};

exports.getPage = function (page, ncb_pagehandler) {
    async.waterfall([
        wiki.getRes.bind(undefined, '/' + encodeURIComponent(page) + '?action=raw'),
        // Resolve redirects
        function (page_content, ncb_downstream) {
            var match = page_content.match(/#(WEITERLEITUNG|REDIRECT) \[\[([^\]]+)\]\]/);
            if (match) {
                wiki.getPage(match[2], ncb_downstream);
            } else {
                ncb_downstream(null, page_content);
            }
        }
    ], ncb_pagehandler);
};

function getUsersInCat(cb_datahandler, ncb_finishhandler) {
    wiki.getCatMembers(function (members, ncb_register_done) {
        var users = members.filter(function (item) {
            return item.ns === 2;
        }).map(function (item) {
            return item.title.replace(ns, '').match(/^([^\/]+)/)[1];
        });
        cb_datahandler(lib.uniq(users), ncb_register_done);
    }, ncb_finishhandler);
}

function getUserPageURL(user) {
    return 'http://' + host + '/' + encodeURIComponent(ns_text + user);
}

exports.getUserPageName = function (user) {
    return ns_text + user;
};

exports.getUserPage = function (user, ncb) {
    return wiki.getPage(wiki.getUserPageName(user), ncb);
};

exports.getIncludedPageNames = function (page) {
    var res = [], include_regexp = /\{\{([^}|]+)(|[^}]*)?\}\}/g, match;
    while (match = include_regexp.exec(page)) {
        switch (match[1].indexOf(':')) {
        case -1:
            // Add template namespace
            match[1] = tpl_ns + match[1];
            break;
        case 0:
            // Remove leading : (used to denote the main namespace)
            match[1] = match[1].slice(1);
            break;
        }
        res.push(match[1]);
    }
    return res;
};

exports.getUsersInCat = getUsersInCat;
exports.getUserPageURL = getUserPageURL;
