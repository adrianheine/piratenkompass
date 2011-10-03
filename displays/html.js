var displays = require('./displays'),
    async = require('async'),
    lib = require('../lib');

function getCoords(inp) {
    return {x: 109 - inp.soc * 9.5,
            y: 123 + inp.ec * 9.5};
}

function out(getData, res) {
    async.waterfall([
        getData,
        displays.prepareViewData.bind(undefined, getCoords, {
            title: 'HTML + CSS + PNG',

            ranges: null,
            compasses: null,
            avg: null,
            err_users: null,
        })
    ], function (err, params) {
        res.render('html', params);
    });
}

exports.out = out;
