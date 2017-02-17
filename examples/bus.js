'use strict';

var PromiseBus = require('promisebus');
var bus = new PromiseBus();


var app = {};

bus.register('logger', function(context) {
    console.log('- loading: logger', context);
    return Promise.resolve({log:console.log, info: console.info, warn:console.warn});
});

bus.register('dispatcher', function(context) {
    console.log('- loading: dispatcher', context);
    var noop = function(){};
    return Promise.resolve({emit:noop, on: noop});
});


bus.register('repl', ['logger'], function(context, data) {
    console.log('- loading: repl', context, data);
    return Promise.resolve({run:function(){}});
});

bus.register('pubsub', ['logger'], function(context, data) {
    console.log('- loading: pubsub', context, data);
    var noop = function(){};
    return Promise.resolve({publish: noop, subscribe: noop});
});

bus.register('server.routes', ['logger'], function(context, data) {
    console.log('- loading: server.routes', context, data);
    var noop = function(){};
    return Promise.resolve({routes:[] });
});

bus.register('server.middleware', ['logger'], function(context, data) {
    console.log('- loading: server.middleware', context, data);
    var noop = function(){};
    return Promise.resolve({middleware:[] });
});

bus.register('boot', ['dispatcher', 'repl', 'pubsub'/*, 'kaka'*/], function(context, data) {
    console.log('----------------------');
    console.log('boot', context, data);
    console.log('----------------------');
    return context;
});




bus.runTask('boot', 6).then(function(probability) {
    console.log('probability', probability);
    if (probability > 0.5) {
        console.log('Guys, this should be an easy one, why is it still around?');
    }
});

// bus.run(app).then(function(context) {
//     console.log('boot ran OK', context);
// });
