"use strict";

/**
 * Module dependencies.
 */

var express = require('express');
var app = module.exports = express.createServer();

// General configuration

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/favicon.ico'));
  app.use('/static', express['static'](__dirname + '/static',
    {maxAge: 1000 * 60 * 60 * 24 * 365}));
  app.use(express.logger('[:date] ":url" :status ":referrer" ":user-agent"'));
  app.use(app.router);
});

app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
  app.use(express.errorHandler());
});

// Routes

// Redirect to source
app.get('/source', function (req, res, next) {
  return res.redirect('https://github.com/adrianlang/piratenkompass', 307);
});

// Support legacy URLs
app.get((function () {
  var legacyMap = {
    display: '/html',
    big: '/svg',
    svg: '/svg/raw',
    raw: '/csv/raw',
    source: '/source'
  };

  return function (req, res, next) {
    if (req.query.t && legacyMap.hasOwnProperty(req.query.t)) {
      return res.redirect(legacyMap[req.query.t], 301);
    }

    next();
  };
}()));

// Main routes
app.get('/:format?/:mod?', (function () {
  var piratenkompass = require('./piratenkompass');

  var displays = {};

  function getDisplay(format) {
    if (!displays[format]) {
      displays[format] = require('./displays/' + format);
    }

    return displays[format];
  };

  return function (req, res, next) {
    // Validate format and mod
    if ([undefined, 'svg', 'html', 'csv'].indexOf(req.params.format) === -1 ||
      [undefined, 'raw'].indexOf(req.params.mod) === -1) {
      return next();
    }

    // If no version specified, use SVG version when browser supports it
    if (typeof req.params.format === 'undefined') {
      req.params.format = req.accepts('xhtml') ? 'svg' : 'html';
    }

    res.local('embedPath', 'http://piratenkompass.adrianlang.de/' + req.params.format + '/raw');
    // Output the stuff
    getDisplay(req.params.format).out(piratenkompass.getKompassdata, res,
      req.params.mod === 'raw');
  };
}()));

// Start server

app.listen(3000);

console.log("Express server listening on port %d in %s mode",
  app.address().port, app.settings.env);
