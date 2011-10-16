var displays = require('./displays'),
    async = require('async'),
    lib = require('../lib');

function getCoords(inp) {
    return {x: 10 *  inp.ec,
            y: 10 * -inp.soc };
}

function out(getData, res, raw) {
    var data = raw ? {
        getCoords: getCoords,

        layout: false,

        // map ranges
        ranges: null,
        // individual compasses
        compasses: null,
        // average
        avg_coords: null
    } : {
        getCoords: getCoords,

        title: 'SVG',
    };
    async.waterfall([
        getData,
        displays.prepareViewData.bind(undefined, data)
    ], function (err, params) {
        if (err) {
            return displays.errHandler(err, res);
        }
        if (raw) {
            res.contentType('svg');
        }
        res.render(raw ? 'graph.svg.jade' : 'page-svg', params);
    });
}

exports.out = out;
