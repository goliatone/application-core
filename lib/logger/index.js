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

    Logger = new (winston.Logger)(config);

    Logger = winstonWrapper(Logger);

    if(config.meta){
        Logger.addMeta(config.meta);
    }

    Logger.addMeta({
        loggerName: 'root',
    });

    var _instances = {};

    Logger.get = function(name, config={}){
        if(_instances[name]) return _instances[name];
        var options = extend({}, app.config.logger, config[name] ? config[name] : config);
        var logger = new (winston.Logger)(options);
        logger = winstonWrapper(logger);
        var meta = extend({}, {loggerName: name}, config.meta);
        logger.addMeta(meta);
        _instances[name] = logger;
        logger.log('Adding logger %s', name);
        return logger;
    };

    app.getLogger = Logger.get;

    return Logger;
};

class Filter {
    constructor(config){
        config = extend({}, Filter.DEFAULTS, config);

        if(config.autoinitialize){
            this.init(config);
        }
    }

    init(config){

        extend(this, config);
    }

    run(message){

    }
}

Filter.DEFAULTS = {
    keywords: {
        password: '*',
        username: 'hash'
    }
};

///////
class Message {
    constructor(){
        this._colorizer = null;
        this._message = 'No message';
        this._timestamp = null;
        this._level = 'info';
        this._label = null;
        this._from = null;
        // this._template = '[{{timestamp}} {{level}}] {{message}}';
    }

    /**
    *
    * @param {Colorizer} colorizer
    */
    setColorizer (colorizer) {
        this._colorizer = colorizer;
        return this;
    }

    colorify (level, message) {
        try {
            return this._colorizer(level, message);
        } catch (e) {
            return message;
        }
    }

    /**
    * @param {string|undefined} message
    * @return {Message}
    */
    setMessage (message) {
        if (message) {
            this._message = message;
        }
        return this;
    }

    setLoggerName(name){
        if(name){
            this._loggerName = name;
        }
        return this;
    }

    /**
    * @param {boolean|function} timestamp
    * @return {Message}
    */
    setTime (timestamp) {
        if (typeof timestamp === 'function') {
            this._timestamp = timestamp();
        } else if (timestamp) {
            var format = typeof timestamp === 'string' ? timestamp : 'hh:mm:ss';
            this._timestamp = this.dateFormat(format);
        }

        return this;
    }

    /**
    * @param {string|undefined} label
    * @return {Message}
    */
    setLabel (label) {
        if (label) {
            this._label = label;
        }
        return this;
    }

    /**
    * @param {string|undefined} level
    * @return {Message}
    */
    setLevel (level) {
        if (level) {
            this._level = level.toLowerCase();
        }

        return this;
    }

    /**
    * @param {string|undefined} from
    * @return {Message}
    */
    setFrom (from) {
        if (from) {
            this._from = from;
        }
        return this;
    }
    /*
     * eg: format="YYYY-MM-DD hh:mm:ss";
     */
    dateFormat(format) {
        var date = new Date();

        var o = {
            'M+' : date.getMonth()+1,    //month
            'D+' : date.getDate(),    //day
            'h+' : date.getHours(),    //hour
            'm+' : date.getMinutes(),    //minute
            's+' : date.getSeconds(),    //second
            'q+' : Math.floor((date.getMonth()+3)/3),    //quarter
            'S' : date.getMilliseconds()    //millisecond
        };

        if(/(Y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear()+'').substr(4 - RegExp.$1.length));
        }

        for(var k in o) {
            if(new RegExp('('+ k +')').test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ('00'+ o[k]).substr((''+ o[k]).length));
            }
        }
        return format;
    }

    toString () {
        var before = '[';
        var from = '';
        var after = '';

        if (this._label) {
            before += `${this._label}] [`;
        }

        before += `${this._level.toUpperCase()}`;

        if (this._timestamp) {
            before += ` ${this._timestamp}`;
        }

        if(this._loggerName) before += ` ${this._loggerName}`;

        before += '] ';

        before = this.colorify(this._level, before);

        if (this._from) {
            from += `${this._from} `;
            after += '- ';
        }

        after += `${this._message}`;

        // after = this.colorify(this._level, after);
        return before + from + after;
    }
}

///////
module.exports.Message = Message;

module.exports.afterSolver =  function(config){
    var prefix = config.logger.filenamePrefix,
        dirname = config.logger.dirname;

    config.logger.transports.map((tr)=> {

        if(prefix){
            tr._basename = tr.filename = prefix + '-'+ tr.filename;
        }

        if(dirname) {
            tr.dirname = config.logger.dirname;
        }
    });

    config.logger.exceptionHandlers.map((tr)=> {

        if(prefix){
            tr._basename = tr.filename = prefix + '-'+ tr.filename;
        }

        if(dirname) {
            tr.dirname = config.logger.dirname;
        }
    });
};
