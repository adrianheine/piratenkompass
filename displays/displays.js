var lib = require('../lib.js');

exports.getRange = function (data, percent) {
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
