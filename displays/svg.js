var displays = require('./displays'),
    async = require('async'),
    lib = require('../lib');

function getCoords(inp) {
    return {x: 10 *  inp.ec,
            y: 10 * -inp.soc };
}

function out(getData, res, raw) {
    var data = raw ? {
        layout: false,

        // map ranges
        ranges: null,
        // individual compasses
        compasses: null,
        // average
        avg_coords: null
    } : {
        title: 'SVG',
        avg: null
    };
    async.waterfall([
        getData,
        displays.prepareViewData.bind(undefined, getCoords, data)
    ], function (err, params) {
        if (raw) {
            res.contentType('svg');
        }
        res.render(raw ? 'graph.svg.jade' : 'page-svg.html.jade', params);
    });
}

exports.out = out;
