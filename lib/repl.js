/*jshint esversion:6, node:true*/
'use strict';

var REPL = require('poke-repl');

/* Use poke-repl to create a TCP repl.
 */
module.exports.init = function(app, config){

    var enabled = app.config.get('repl.enabled', false);
    if(enabled === false){
        return this.debug('REPL disabled');
    }

    var options = config;
    options.root = app.basepath;

    var repl = new REPL(options);

    app.on('run.post', function(){
        console.log('- RUN POST');
        app.emit('repl.ready', repl);
        repl.listen();
    });
};
