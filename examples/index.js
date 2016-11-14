/*jshint esversion:6*/
'use strict';
var Application = require('..').Application;

//config here is a gkeypath Wrapper instance
var config = Application.loadConfig({}, true);

var app = new Application({config});

//use ioc


app.onceRegistered('dispatcher', ()=>{
    app.chainEvents(['run.pre', 'run',], ['error']).then(()=>{
        console.log('A) RUN.PRE AND RUN DONE!');
    }).catch();

    app.chainEvents(['run.pre', 'run', 'run.post'], ['error']).then(()=>{
        console.log('B) RUN.PRE, RUN AND RUN.POST DONE!');
    });
});

app.on('run.post', function(){
    this.register(require('debug')('application-core'), 'debug');
    this.logger.debug('--------');
    this.logger.debug(this.name);
    this.logger.debug('--------');
});

// app.on('bootstrap.ready', app.run);
app.run();
