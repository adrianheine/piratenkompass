var displays = require('./displays'),
    async = require('async'),
    lib = require('../lib');

function getCoords(inp) {
    return {x: 109 - inp.soc * 9.5,
            y: 123 + inp.ec * 9.5};
}

function out(getData, res, raw) {
    var data = raw ? {
        getCoords: getCoords,

        title: 'HTML + CSS + PNG',

        layout: false,

        ranges: null,
        compasses: null
    }: {
        getCoords: getCoords,
        title: 'HTML + CSS + PNG',

        ranges: null,
        compasses: null,
        avg: null,
    };
    async.waterfall([
        getData,
        displays.prepareViewData.bind(undefined, data)
    ], function (err, params) {
        if (err) {
            return displays.errHandler(err, res);
        }
        res.render(raw ? 'graph-wrapper.html.jade' : 'page-html', params);
    });
}

exports.out = out;
