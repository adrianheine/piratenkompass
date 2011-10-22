"use strict";

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
    app.use('/static', express['static'](__dirname + '/static'));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// Routes
app.get('/:format?/:mod?', function (req, res, next) {
    // Support legacy URLs
    if (req.query.t) {
        var map = {
            display: '/html',
            big: '/svg',
            svg: '/svg/raw',
            raw: '/csv/raw'
    //        source: 
        };

        if (map[req.query.t]) {
            return res.redirect(map[req.query.t], 301); // FIXME correct code
        }
    }

    if ([undefined, 'svg', 'html', 'csv'].indexOf(req.params.format) === -1 ||
        [undefined, 'raw'].indexOf(req.params.mod) === -1) {
        return next();
    }

    if (typeof req.params.format === 'undefined') {
        // Use SVG version when browser supports it
        req.params.format = req.accepts('xhtml') ? 'svg' : 'html';
    }

    if (!displays[req.params.format]) {
        displays[req.params.format] = require('./displays/' + req.params.format);
    }
    displays[req.params.format].out(piratenkompass.getKompassdata, res, req.params.mod === 'raw');
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
