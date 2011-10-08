
/**
 * Module dependencies.
 */

var express = require('express'),
    piratenkompass = require('./piratenkompass'),
    displays = {};

var app = module.exports = express.createServer();

// Configuration

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
//    app.use(express.bodyParser());
//    app.use(express.methodOverride());
    app.use(app.router);
    app.use('/static', express.static(__dirname + '/static'));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// Routes

app.get('/:format?/:mod?', function (req, res, next) {
    if ([undefined, 'svg', 'html', 'csv'].indexOf(req.params.format) === -1 ||
        [undefined, 'raw'].indexOf(req.params.mod) === -1) {
        return next();
    }

    req.params.format = req.params.format || 'svg';

    if (!displays[req.params.format]) {
        displays[req.params.format] = require('./displays/' + req.params.format);
    }
    displays[req.params.format].out(piratenkompass.getKompassdata, res, req.params.mod === 'raw');
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
