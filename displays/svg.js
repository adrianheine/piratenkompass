var displays = require('./displays'),
    wiki = require('../wiki'),
    lib = require('../lib');

function getCoords(inp) {
    return {x: 10 *  inp.ec,
            y: 10 * -inp.soc };
}

function out(getData, res) {

    getData(function (err, data) {
        var users_data = lib.groupBy(data, function (compass) {
                return 'compass' in compass ? 'success' : 'fail';
            }),

            sums = {ec: 0, soc: 0},

            params = {
                layout: false,

                // map ranges
                ranges: lib.mapValues({80: null, 90: null}, function (_, range) {
                    return lib.mapValues(displays.getRange(lib.pluck(users_data.success, 'compass'), range),
                                         getCoords);
                }),

                // individual compasses
                compasses: users_data.success.map(function (compass) {
                    sums.ec += compass.compass.ec;
                    sums.soc += compass.compass.soc;

                    return {
                        name: compass.name,
                        compass: compass.compass,
                        url: wiki.getUserPageURL(compass.name),
                        coords: getCoords(compass.compass)
                    };
                }),

                // average
                avg: getCoords(lib.mapValues(sums, function (v) {
                    return v / data.length;
                })),

                // error users
                err_users: lib.pluck(users_data.fail, 'name')
            };

        res.contentType('svg');
        res.render('graph.svg.jade', params);
    });
}

exports.out = out;
