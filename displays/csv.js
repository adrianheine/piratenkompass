"use strict";

var displays = require('./displays');

function out(getData, res, raw) {
  getData(function (err, in_data) {
    if (err) {
      return displays.errHandler(err, res);
    }
    var csv = 'User,Socially,Economically\n';
    csv += (displays.groupData(in_data).success || []).map(function (entry) {
      return '"' + [entry.name, entry.compass.soc, entry.compass.ec].join('","') + '"';
    }).join('\n');
    if (raw) {
      res.contentType('csv');
      res.send(csv);
    } else {
      displays.prepareViewData({
        csv: csv,
        title: 'CSV'
      }, in_data, function (err, view_data) {
        res.render('page-csv', view_data);
      });
    }
  });
}

exports.out = out;
