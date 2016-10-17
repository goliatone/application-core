/*jshint esversion:6*/
'use strict';
var Application = require('..').Application;

//config here is a gkeypath Wrapper instance
var config = Application.loadConfig({}, true);

var app = new Application({config});

//use ioc
app.register(require('debug')('application-core'), 'debug');

app.on('run.post', function(){
    this.logger.log('--------');
    this.logger.log(this.name);
    this.logger.log('--------');
});

app.run();
