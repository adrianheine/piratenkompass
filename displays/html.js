var displays = require('./displays'),
    async = require('async'),
    lib = require('../lib');

function getCoords(inp) {
    return {x: 109 - inp.soc * 9.5,
            y: 123 + inp.ec * 9.5};
}

function out(getData, res, raw) {
    var data = raw ? {
        title: 'HTML + CSS + PNG',

        layout: false,

        ranges: null,
        compasses: null
    }: {
        title: 'HTML + CSS + PNG',

        ranges: null,
        compasses: null,
        avg: null,
        err_users: null
    };
    async.waterfall([
        getData,
        displays.prepareViewData.bind(undefined, getCoords, data)
    ], function (err, params) {
        res.render(raw ? 'graph-wrapper.html.jade' : 'page-html', params);
    });
}

exports.out = out;
