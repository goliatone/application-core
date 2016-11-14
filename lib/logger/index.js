/*jshint esversion:6, node:true*/
'use strict';
var extend = require('gextend');
var winston = require('winston');
var winstonWrapper = require('winston-meta-wrapper');

var Logger;
//TODO: integrate https://github.com/goliatone/noop-console
//so we can silence all other console logs and use this one
//instead.
module.exports.init = function(app, config){
    if(Logger) return Logger;

    var _instances = {};

    function getLogger(name, config={}){
        if(_instances[name]) return _instances[name];
        var options = extend({}, app.config.logger, config[name] ? config[name] : config);
        var logger = new (winston.Logger)(options);
        logger = winstonWrapper(logger);
        var meta = extend({}, {loggerName: name}, config.meta);
        logger.addMeta(meta);
        _instances[name] = logger;
        logger.log('Adding logger %s', name);
        return logger;
    }

    Logger = getLogger('core', { meta:{
        loggerName: 'core',
    }});

    Logger.get =
    app.getLogger = getLogger;

    return Logger;
};

/*
 * The logger module should be the
 * first module we load.
 */
module.exports.priority = -2000000;

module.exports.Filter = require('./filter');
module.exports.Message = require('./message');
module.exports.afterSolver =  require('./afterSolver');
