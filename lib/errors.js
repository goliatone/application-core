/*jshint esversion:6, node:true*/
'use strict';

module.exports.init = function(app, config){
    //TODO: Integrate signals here!

    /*
     * Cath all uncaught exceptions, log it and exit
     * anyways.
     */
    process.on('uncaughtexception', handleError);
    process.on('exit', cleanup.bind(null, 'exit', 0));
    process.on('SIGINT', cleanup.bind(null, 'SIGINT', 0));
    process.on('SIGTERM', cleanup.bind(null, 'SIGTERM',0));

    function handleError(err){
        var msg = 'ERROR: ' + err.message + '\n'+ err.stack;
        app.logger.error(msg, err, function(){
            app.debug('Logger: error sent:\n%s\n%s', err.message, err.stack);
            cleanup('ERROR', 1);
        });
    }

    app.resolve('monitoring').then(function(monitoring){
        monitoring.signals.on('shutdown', function(event){
            cleanup(event.signal, event.data && isNaN(event.data) ? 1 : event.data );
        });
    });

    function cleanup(label, code){
        if(cleanup.visited) return;
        cleanup.visited = true;

        app.close(code, label).then(function(){
            app.logger.warn('\nCLEANUP reason : %s code: %s', label, code);
            if(app.config.get('app.exitOnError', true)){
                process.exit(code);
            }
        });
    }

    return handleError;
};
