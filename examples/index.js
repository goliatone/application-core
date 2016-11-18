/*jshint esversion:6*/
'use strict';
var Application = require('..').Application;

//config here is a gkeypath Wrapper instance
var config = Application.loadConfig({}, true);

var app = new Application({config});

app.onceRegistered('dispatcher', ()=>{
    app.chainEvents(['run.pre', 'run',], ['error']).then(()=>{
        app.logger.debug('A) RUN.PRE AND RUN DONE!');
    }).catch();

    app.chainEvents(['run.pre', 'run', 'run.post'], ['error']).then(()=>{
        app.logger.debug('B) RUN.PRE, RUN AND RUN.POST DONE!');
    });
});

app.once('run.complete', function(e){
    console.log('hook.complte', e);
});

app.on('run.post', function(){
    this.register(require('debug')('application-core'), 'debug');
    app.logger.debug('--------');
    app.logger.debug(this.name);
    app.logger.debug(this.nicename);
    app.logger.debug('--------');

    let err = new Error('This is a sample error!!!');
    app.logger.error(err.stack);
});


app.once('coreplugins.ready', ()=>{
    app.run();
});
// app.run();
