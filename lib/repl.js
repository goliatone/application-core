/*jshint esversion:6, node:true*/
'use strict';

var REPL = require('poke-repl');

/* Use poke-repl to create a TCP repl.
 */
module.exports.init = function(app, config){

    var enabled = app.config.get('repl.enabled', false);

    if(enabled === false){
        return app.debug('REPL disabled');
    }

    var options = config;
    options.root = app.basepath;

    app.logger.info('= config repel', options);

    var repl = new REPL(options);

    app.on('run.post', function(){
        app.logger.info('- RUN POST');
        repl.listen();
        app.emit('repl.ready', repl);
    });
};
