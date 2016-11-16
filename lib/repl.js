/*jshint esversion:6, node:true*/
'use strict';

var REPL = require('poke-repl');

/* Use poke-repl to create a TCP repl.
 */
module.exports.init = function(app, config){

    var enabled = app.config.get('repl.enabled', false);

    if(enabled === false){
        return app.logger.warn('REPL disabled');
    }

    var options = config;
    options.root = app.basepath;
    options.logger = app.getLogger('logger');

    app.getLogger('logger').debug('config repel', options);

    var repl = new REPL(options);

    app.on('run.post', () => {
        app.getLogger('logger').debug('REPL: running post');
        repl.listen();
        repl.context.app = app;
        app.emit('repl.ready', repl);
    });
};
