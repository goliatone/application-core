/*jshint esversion:6, node:true*/
'use strict';

module.exports.init = function(app, config){
    //TODO: Integrate signals here!

    /*
     * Cath all uncaught exceptions, log it and exit
     * anyways.
     */
    process.on('uncaughtexception', handleError);
    process.on('rejectionHandled', handleError);
    process.on('unhandledRejection', handleError);
    process.on('exit', cleanup.bind(null, 'exit', 0));
    process.on('SIGINT', cleanup.bind(null, 'SIGINT', 0));
    process.on('SIGTERM', cleanup.bind(null, 'SIGTERM',0));

    function handleError(err){
        app.logger.error(err);
        cleanup('ERROR', 1);
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
            /*
             * Here we stll might have 10 seconds to go, or whatever
             * is Serene's timeout value.
             */
            app.logger.warn('\nCLEANUP reason : %s code: %s', label, code);
        });
    }

    return handleError;
};
