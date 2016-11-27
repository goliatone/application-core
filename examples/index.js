/*jshint esversion:6*/
'use strict';
var Application = require('..').Application;

//config here is a gkeypath Wrapper instance
var config = Application.loadConfig({}, true);

var app = new Application({config});

console.log(app.banner);

app.onceRegistered('dispatcher', ()=>{
    app.chainEvents(['run.pre', 'run',], ['error']).then(()=>{
        app.logger.debug('A) RUN.PRE AND RUN DONE!');
    }).catch();

    app.chainEvents(['run.pre', 'run', 'run.post'], ['error']).then(()=>{
        app.logger.debug('B) RUN.PRE, RUN AND RUN.POST DONE!');
    });
});

app.onceRegistered('logger', ()=>{
    // app.logger.mute('core', 'app');
    // app.logger.focus('data-manager');
});

app.once('run.complete', function(e){
    app.logger.debug('run.complete: ', e);
});

app.once('run.pre', function(e){
    app.logger.debug('run.pre: ', e);
    app.logger.debug('TEST LOGGER: %s', e, {age:23, name:'Pepe Rone'});
});

app.once('run.post', function(){
    this.register(require('debug')('application-core'), 'debug');
    app.logger.debug('--------');
    app.logger.debug(this.name);
    app.logger.debug(this.nicename);
    app.logger.debug('--------');

    console.log('------------------');
    console.log('here, here, here');
    console.log('------------------');
    let err = new Error('This is a sample error!!!');
    //app.logger.error(err.stack);
});


app.once('coreplugins.ready', ()=>{
    app.run();
});
// app.run();
