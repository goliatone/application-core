/*jshint esversion:6, node:true*/
'use strict';
var extend = require('gextend');
var winston = require('winston');
var winstonWrapper = require('./wrapper');

var Logger;

/**
 * Logger moudle provides a wrapper around
 * winston.
 * TODO: breadcrumbs: group different logs into a single
 *       transaction. I.E request -> auth -> orm -> command -> response
 *
 * TODO: integrate https://github.com/sindresorhus/log-update
 *
 * TODO: integrate https://github.com/goliatone/noop-console
 *       so we can silence all other console logs
 *       and use this one instead.
 *
 * TODO: Make app.logger behave both as a logger instance,
 *       -i.e. `app.logger.info()`- and as getLogger- i.e.
 *       `app.logger('repl').info()`.
 *
 * TODO: Add filters and rewriters to remove sensitive data
 *       from output.
 *
 * @param  {Object} app    Application context
 * @param  {Object} config Configuration object for "logger"
 * @return {Object}        winston instance
 */
module.exports.init = function(app, config){
    if(Logger) return Logger;

    var _instances = {};

    function getLogger(name, config={}){
        if(_instances[name]) return _instances[name];
        var options = extend({}, app.config.logger, config[name] ? config[name] : config);
        var logger = new (winston.Logger)(options);

        /*
         * We don't want to register a listener for
         * each logger instance. We do it once for
         * the core logger.
         */
        if(_instances.handlingExceptions){
            logger.unhandleExceptions();
        } else _instances.handlingExceptions = true;

        //TODO: This wrapping destructive :( we should
        //fork winston-meta-wrapper and make it proxy style
        logger = winstonWrapper(logger);

        var meta = extend({}, {loggerName: name}, config.meta);
        logger.addMeta(meta);

        // logger.profile = winston.profile;

        _instances[name] = logger;
        logger.log('Adding logger %s', name);
        return logger;
    }

    /*
     * Create private logger instance,
     * we want to do this asap, so dont
     * wait for "logger" to be registered.
     */
    app._logger = getLogger('core');

    Logger = getLogger('app');

    Logger.mute = function(...names){
        let logger;
        names.map((name)=>{
            logger = _instances[name];
            if(logger) logger.setSilent(true);
        });

        return this;
    };

    Logger.unmute = function(...names){
        let logger;
        names.map((name)=>{
            logger = _instances[name];
            if(logger) logger.setSilent(true);
        });

        return this;
    };

    Logger.focus = function(...names){
        Object.keys(_instances).map((name)=>{
            Logger.silence(names.indexOf(name) !== -1);
        });
    };

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
