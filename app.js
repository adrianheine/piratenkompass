
/**
 * Module dependencies.
 */

var express = require('express'),
    piratenkompass = require('./piratenkompass'),
    svg = require('./displays/html');

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

app.get('/', function (req, res) {
    svg.out(piratenkompass.getKompassdata, res);
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
