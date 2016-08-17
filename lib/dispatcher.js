/*jshint esversion:6*/
'use strict';

const EventEmitter = require('events');
var emitter = new EventEmitter();

module.exports.init = function(app, config){
    return emitter;
};
