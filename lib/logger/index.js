/*jshint esversion:6, node:true*/
'use strict';
const extend = require('gextend');
const winston = require('winston');
const winstonWrapper = require('./wrapper');
const wrapConsole = require('./wrapConsole');
const muteConsole = require('./muteConsole');

var Logger;

/**
 * Logger moudle provides a wrapper around
 * winston.
 *
 * Look into pino:
 * https://www.npmjs.com/package/pino
 *
 * TODO: Have a `focused` mode, in which we mute the output
 *       so we don't fill the sreen with noise but we collect
 *       all messages, then using the REPL we selectively
 *       output one thread or another by focusing one ore more
 *       loggers. We need a buffer.
 * TODO: Add utility for express morgan wrapper...
 *       https://gist.github.com/goliatone/6f624c8658af9e986f8949d165977747
 *
 * TODO: Handle child loggers: update metadata, and build name as
 *       parent.child => admin.auth
 *
 * TODO: breadcrumbs: group different logs into a single
 *       transaction. I.E request -> auth -> orm -> command -> response
 *
 * TODO: integrate https://github.com/sindresorhus/log-update
 *
 * ~TODO~: integrate https://github.com/goliatone/noop-console
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
module.exports.init = function(app, config) {
    if(Logger) return Logger;

    /*
     * We need to keep track of muted
     * instances so that we can turn
     * them off before they are created...
     */
    var _muted = {};

    var _focused = [];

    /*
     * Sanitize name, i.e so that LDAP and ldap are the
     * same instance.
     */
    let _sanitizeName = config.sanitizeName || function(name){
        if(!name){
            //_instances[config.coreLoggerName].warn('You are using empty name!');
            return name;
        }
        return name.toLowerCase();
    };

    /*
     * Keep track of all instances,
     * needed to manage mute/unmute
     * etc.
     */
    var _instances = {};

    var handlingExceptions = false;

    function getLogger(name, config={}){

        name = _sanitizeName(name);

        if(_instances[name]) return _instances[name];
        var options = extend({}, app.config.logger, config[name] ? config[name] : config);
        var logger = new (winston.Logger)(options);

        /*
         * Expose the getLogger function
         * through child loggers.
         */
        logger.getLogger = getLogger;

        /*
         * We don't want to register a listener for
         * each logger instance. We do it once for
         * the core logger.
         */
        if(handlingExceptions) {
            logger.unhandleExceptions();
        } else handlingExceptions = true;

        //TODO: This wrapping destructive :( we should
        //fork winston-meta-wrapper and make it proxy style
        logger = winstonWrapper(logger);

        var meta = extend({}, {loggerName: name}, config.meta);
        logger.addMeta(meta);

        if(_muted[name]) logger.setSilent(true);

        if(_focused.length && _focused.indexOf(name) === -1) {
            logger.setSilent(true);
        }

        _instances[name] = logger;

        logger.info('Created logger "%s"...', name);

        return logger;
    }

    /*
     * Create private logger instance,
     * we want to do this asap, so dont
     * wait for "logger" to be registered.
     */
    app._logger = getLogger('core');

    Logger = getLogger('app');

    Logger.mute = function _mute(...names) {
        let logger;
        names.map((name)=>{
            Logger.silence(name, true);
        });

        return this;
    };

    Logger.unmute = function _unmute(...names) {
        let logger;
        names.map((name)=> {
            Logger.silence(name, false);
        });

        return this;
    };

    Logger.silence = function _silence(name, silent=true) {
        if(silent) _muted[name] = true;
        else delete _muted[name];

        let logger = _instances[name];
        if(!logger) return;

        logger.setSilent(silent);
    };

    Logger.unfocus = function _unfocus() {
        _focused.length = 0;
        //TODO: figure out a smarter way of doing this.
        //less destructive.
        Object.keys(_instances).map((name)=>{
            Logger.silence(name, false);
        });
    };

    Logger.focus = function _focus(...names) {
        //focus means that we might have instances
        //that are set to be OK before they are created.
        //we can't use muted, because we can only mute
        //known id's...
        _focused.length = 0;
        names.map((name) => _focused.push(name));

        Object.keys(_instances).map((name)=> {
            Logger.silence(name, names.indexOf(name) === -1);
        });
    };

    Logger.get =
    app.getLogger = getLogger;

    if(config.wrapConsole) {
        wrapConsole(app, config);
    }

    if(config.muteConsole) {
        muteConsole(app, config);
    }

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
