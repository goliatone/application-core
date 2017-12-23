/*jshint esversion:6, node:true*/
'use strict'

var extend = require('gextend');

//https://github.com/alexgorbatchev/winston-child/blob/master/lib/winston-child.js


/**
 * filters: used to meddle with the content string, e.g.
 * 
 * `logger.info('User id: 423423 pass: ahdaljwer')` => 
 * >info: User id: 4...23 pass: ahd.....r
 * 
 * rewriters: used to format metadata:
 * 
 * `logger.info('transaction ok', {__meta__: {creditCard: 123456789012345}})`
 * 
 * >info: transaction ok creditCard=123456****2345
 * 
 * @memberof core/Logger
 * @param {core/Logger} logger Logger instance
 */
function wrapper(logger) {

    logger._meta = {};
    logger._filters = {};

    logger.addMeta = function addMeta(meta) {
        extend(this._meta, meta);
    };

    logger.setSilent = function(silent) {
        this._silent = silent;
    };

    logger._log = logger.log;

    logger.log = function (...args) {
        if(this._silent) return;

        var meta,
            lastArgument = args[args.length - 1] || {};
        if(typeof lastArgument === 'object' && lastArgument.__meta__){
            meta = extend({}, this._meta, lastArgument.__meta__);
            args.pop();
        } else meta = extend({}, this._meta);

        if(meta) args = args.concat([meta]);

        this._log.apply(this, args);
    };

    return logger;

}

module.exports = wrapper;
