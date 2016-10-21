var Gioc = require('..');
console.log("GIOC");

process.env.DEBUG='*';

var container = {};
var gioc = new Gioc();
gioc.logger.error = console.error.bind(console);

gioc.map('debug', require('debug'));

var d = gioc.solve('debug', {args:'GIOC', construct: true});

var app = {};
gioc.inject('debug', app, {args:'GIOC', construct: true, expose: true});

d('Standalone function...');
app.debug('Injected into "app"');
debug('This "debug" was globally exposed by gioc');
// console.log('debug', d);
// console.assert(d.debug === debug);
