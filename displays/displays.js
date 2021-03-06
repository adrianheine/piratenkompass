"use strict";

var lib = require('../lib.js'),
  wiki = require('../wiki'),
  assert = require('assert');

function getRange(data, percent) {
  var rel_offset = percent / 200,
    high = Math.ceil(data.length * (0.5 + rel_offset)),
    low = Math.floor(high - data.length * 2 * rel_offset),
    sorted_datas,
    ret;

  if ((high - low / data.length) < percent / 100) {
    console.err('Too small window – ' + percent + ' wanted, ' +
          lib.numForOutput(high - low / data.length) + ' given');
  }
  high -= 1;

  // Construct two arrays ec and soc each holding the respective sorted
  // values
  sorted_datas = lib.mapValues({ec: null, soc: null}, function (_, key) {
    return lib.numSort(lib.pluck(data, key));
  });

  // Return two objects from and to each holding an ec, soc-pair
  ret = lib.mapValues({from: low, to: high}, function (index) {
    return lib.mapValues(sorted_datas, function (v) {
      return v[index];
    });
  });

  assert.ok(ret.from.ec < ret.to.ec, 'Lower ec range bound ' + ret.from.ec + ' bigger than upper ' + ret.to.ec);
  assert.ok(ret.from.soc < ret.to.soc, 'Lower soc range bound ' + ret.from.soc + ' bigger than upper ' + ret.to.soc);

  return ret;
}

exports.groupData = function (in_data) {
  return lib.groupBy(in_data, function (compass) {
    return compass.hasOwnProperty('compass') ? 'success' : (compass.not_init ? 'not_init' : 'fail');
  });
};

exports.prepareViewData = function (view_data, in_data, ncb_callback) {
  var users_data = lib.extend({success: [], fail: [], not_init: []},
                exports.groupData(in_data)),
    success_compasses;

  if (view_data.layout !== false) {
    // Add data needed by layout.jade
    view_data = lib.extend(view_data, {
      avg: null,
      err_users: null,
      count: null,
      getUserPageURL: wiki.getUserPageURL,
      getPageURL: wiki.getPageURL
    });
  }

  // compass ranges
  if (view_data.ranges === null) {
    success_compasses = lib.pluck(users_data.success, 'compass');
    view_data.ranges = lib.mapValues({80: null, 90: null}, function (_, range) {
      return lib.mapValues(getRange(success_compasses, range),
                 view_data.getCoords);
    });
  }

  // individual compasses
  if (view_data.compasses === null) {
    view_data.compasses = users_data.success.map(function (entry) {
      return {
        url: wiki.getUserPageURL(entry.name),
        coords: view_data.getCoords(entry.compass),
        desc: 'Benutzer:' + entry.name + ' – ' + entry.compass.toString()
      };
    });
  }

  // average
  if (view_data.avg === null || view_data.avg_coords === null) {
    view_data.avg = lib.mapValues(lib.reduce(users_data.success, function (sums, compass) {
      sums.ec += compass.compass.ec;
      sums.soc += compass.compass.soc;
      return sums;
    }, {ec: 0, soc: 0}), function (v) {
      return v / users_data.success.length;
    });

    // Calculate coords, if requested
    if (view_data.avg_coords === null) {
      view_data.avg_coords = view_data.getCoords(view_data.avg);
    }

    // Round average
    view_data.avg = lib.mapValues(view_data.avg, lib.numForOutput);
  }

  // Count of compasses
  if (view_data.count === null) {
    view_data.count = users_data.success.length;
    view_data.not_init_count = users_data.not_init.length;
  }

  // error users
  if (view_data.err_users === null) {
    view_data.err_users = lib.pluck(users_data.fail, 'name');
  }

  ncb_callback(null, view_data);
};

exports.errHandler = function (err, res) {
  return res.render('error', {title: 'Error', err: err});
};
