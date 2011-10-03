var displays = require('./displays'),
    lib = require('../lib');

function getCoords(inp) {
    return {x: 10 *  inp.ec,
            y: 10 * -inp.soc };
}

function out(getData, res) {

//    async.waterfall([getData, displays.prepareViewData
    getData(function (err, data) {
        displays.prepareViewData(getCoords, data, {
            layout: false,

            // map ranges
            ranges: null,
            // individual compasses
            compasses: null,
            // average
            avg: null
        }, function (err, params) {
            res.contentType('svg');
            res.render('graph.svg.jade', params);
        });
    });
}

exports.out = out;
