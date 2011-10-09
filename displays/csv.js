var displays = require('./displays');

function out(getData, res, raw) {
    getData(function (err, data) {
        var csv = 'User,Socially,Economically\n';
        data = displays.groupData(data).success || [];
        csv += data.map(function (entry) {
            return '"' + [entry.name, entry.compass.soc, entry.compass.ec].join('","') + '"';
        }).join('\n');
        if (raw) {
            res.contentType('csv');
            res.send(csv);
        } else {
            res.render('page-csv', {csv: csv, title: 'CSV', protocol: 'http'});
        }
    });
}

exports.out = out;
