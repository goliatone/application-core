/*jshint esversion:6*/
'use strict';
var Application = require('..').Application;

//config here is a gkeypath Wrapper instance
var config = Application.loadConfig({}, true);

var app = new Application({config});

//use ioc


app.on('run.post', function(){
    app.register(require('debug')('application-core'), 'debug');
    this.logger.log('--------');
    this.logger.log(this.name);
    this.logger.log('--------');
});

app.run();
