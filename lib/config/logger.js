/*jshint esversion:6, node:true*/
'use strict';

var winston = require('winston');

/*
 * Winston:
 * We use the Console and daily rotate file transports
 * and if provided, we also use Honeybadger.
 */
var transports = [
    new (winston.transports.Console)({
        handleExceptions: true,
        prettyPrint: true,
        silent: false,
        timestamp: true,
        colorize: true,
        json: false,
        /*formatter: function(options) {
            var message = new Date().toLocaleString() + ' ';
            message += options.message || '';
            message += (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
            return message;
        }*/
    })
];

module.exports = {
    transports: transports
};
