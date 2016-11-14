/*jshint esversion:6*/
'use strict';
var Application = require('..').Application;

//config here is a gkeypath Wrapper instance
var config = Application.loadConfig({}, true);

var app = new Application({config});

//use ioc


app.on('run.post', function(){
    this.register(require('debug')('application-core'), 'debug');
    this.logger.debug('--------');
    this.logger.debug(this.name);
    this.logger.debug('--------');
});

// app.on('ready', app.run);
app.run();
