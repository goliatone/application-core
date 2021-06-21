/*jshint esversion:6, node:true*/
'use strict';

const winston = require('winston');
const config = require('winston/lib/winston/config');
const Message = require('../logger').Message;

/**
 * This is a quick hack to disable handling exceptions
 * with winston if node version >= 15 since it will 
 * break the REPL.
 * We should figure out a way to handle this in a better
 * way.
 */
const WINSTON_HANDLE_EXCEPTIONS = nodeVersionIsLowerThan(15, process.version);


function nodeVersionIsLowerThan(mayor, version = '') {
    version = version.replace('v', '');
    let chunks = version.split('.');
    return chunks[0] > mayor;
}

/*
 * Winston:
 * We use the Console and daily rotate file transports
 * and if provided, we also use Honeybadger.
 */
const transports = [
    new(winston.transports.Console)({
        // name: 'console',
        handleExceptions: WINSTON_HANDLE_EXCEPTIONS,
        prettyPrint: true,
        silent: false,
        level: process.env.NODE_LOG_LEVEL || 'silly',
        timestamp: 'hh:mm:ss:S',
        colorize: true,
        json: false,
        formatter: function(options) {
            const message = new Message()
                .setColorizer(config.colorize)
                .setColors(config.allColors)
                .setColor('error-msg', ['bgRed', 'bold', 'white'])
                .setColor('warn-msg', ['inverse', 'bold'])
                .setTime(options.timestamp)
                .setLabel(options.label)
                .setLevel(options.level)
                .setFrom(options.from)
                .setMessage(options.message);

            if (options.meta) {
                if (options.meta.loggerName) {
                    message.setLoggerName(options.meta.loggerName);
                }

                if (options.meta.style) {
                    message.setTextStyle(options.meta.style);
                }
            }

            return message.toString();
        }
    }),
    new(winston.transports.File)({
        filename: 'debug.log',
        // filename: './${app.name}-debug.log',
        name: 'file.debug',
        level: 'debug',
        maxsize: 1024000,
        maxFiles: 3,
        handleExceptions: WINSTON_HANDLE_EXCEPTIONS,
        json: false
    })
];

/** 
 * Default configuration object for Logger
 * module.
 * 
 * @type {Object}
 
 * @param {Object} [wrapConsole=true]
 * @param {Array} [exceptionHandlers=[winston.transports.File]]
 * @param {Array} [transports=[winston.transports.File,winston.transports.Console]]
 * @name config
 * @memberof core/logger
*/
module.exports = {
    wrapConsole: true,
    silentInProd: false,
    transports: transports,
    exceptionHandlers: WINSTON_HANDLE_EXCEPTIONS ? [
        new winston.transports.File({
            filename: 'exceptions.log',
            maxsize: 1024000,
            maxFiles: 3,
            name: 'file.exceptions',
            json: false
        })
    ] : false
};

/*
 * This get's executed after we have solved
 * our dependencies and before we return the
 * final config object.
 */
module.exports.afterSolver = function(config) {

    const silentInProd = config.logger.silentInProd;
    const env = config.get('environment', 'production');
    /*
     * If we are in production, get rid of the
     * debug transport.
     */
    if (env === 'production' && silentInProd) {
        const transports = [];
        config.logger.transports.map((tr) => {
            if (tr.name === 'console') return;
            if (tr.name === 'file.debug') return;
            transports.push(tr);
        });
        config.logger.transports = transports;
        config.logger.muteConsole = true;
    }
};