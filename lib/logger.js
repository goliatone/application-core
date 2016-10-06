/*jshint esversion:6, node:true*/
'use strict';

var winston = require('winston');

var logger;

module.exports.init = function(app, config){
    if(logger) return logger;

    logger = new (winston.Logger)(config);

    return logger;
};