/*jshint esversion:6, node:true*/
'use strict';

var winston = require('winston');

var logger;
//TODO: integrate https://github.com/goliatone/noop-console
//so we can silence all other console logs and use this one
//instead.
module.exports.init = function(app, config){
    if(logger) return logger;

    logger = new (winston.Logger)(config);

    return logger;
};
