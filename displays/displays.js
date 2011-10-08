var lib = require('../lib.js'),
    wiki = require('../wiki');

function getRange(data, percent) {
    var rel_offset = percent / 200,
        high = Math.ceil(data.length * (0.5 + rel_offset)),
        low = Math.floor(high - data.length * 2 * rel_offset),
        sorted_datas;

    if ((high - low / data.length) < percent / 100) {
        // FIXME correct round?
        console.err('Too small window – ' + percent + ' wanted, ' +
                    Math.round((high - low / data.length) * 100) / 100 +
                    ' given');
    }
    high -= 1;

    // Construct two arrays ec and soc each holding the respective sorted
    // values
    sorted_datas = lib.mapValues({ec: null, soc: null}, function (_, key) {
        return lib.pluck(data, key).sort();
    });

    // Return two objects from and to each holding an ec, soc-pair
    return lib.mapValues({from: low, to: high}, function (index) {
        return lib.mapValues(sorted_datas, function (v) {
            return v[index];
        });
    });
};

exports.prepareViewData = function(getCoords, view_data, in_data, ncb_callback) {
    var users_data = lib.groupBy(in_data, function (compass) {
            return 'compass' in compass ? 'success' : 'fail';
        });

    if ('success' in users_data) {
        // compass ranges
        if (view_data.ranges === null) {
            view_data.ranges = lib.mapValues({80: null, 90: null}, function (_, range) {
                return lib.mapValues(getRange(lib.pluck(users_data.success, 'compass'), range),
                                     getCoords);
            });
        }

        // individual compasses
        if (view_data.compasses === null) {
            view_data.compasses = users_data.success.map(function (compass) {
                return {
                    name: compass.name,
                    compass: lib.mapValues(compass.compass, lib.numForOutput),
                    url: wiki.getUserPageURL(compass.name),
                    coords: getCoords(compass.compass)
                };
            });
        }

        // average
        if (view_data.avg === null || view_data.avg_coords === null) {
            view_data.avg = lib.mapValues(lib.reduce(users_data.success,
                                                               function (sums, compass) {
                sums.ec += compass.compass.ec;
                sums.soc += compass.compass.soc;
                return sums;
            }, {ec: 0, soc: 0}), function (v) {
                return v / users_data.success.length;
            });

            // Calculate coords, if requested
            if (view_data.avg_coords === null) {
                view_data.avg_coords = getCoords(view_data.avg);
            }

            // Round average
            view_data.avg = lib.mapValues(view_data.avg, lib.numForOutput);
        }
    }

    // error users
    if (view_data.err_users) {
        if ('fail' in users_data) {
            view_data.err_users = lib.pluck(users_data.fail, 'name');
        } else {
            view_data.err_users = [];
        }
    }

    // FIXME
    view_data.protocol = 'http';

    ncb_callback(null, view_data);
};
