/*jshint esversion:6, node:true*/
'use strict';
const { addJSONSerializer } = require('./serializer');

module.exports.init = function(app, config) {
    //TODO: Integrate signals here!

    /**
     * We want to be able to serialize Error instances
     * using our regular JSON class.
     */
    if (!('toJSON' in Error.prototype)) {
        addJSONSerializer(app.isProduction);
    }

    /*
     * Cath all uncaught exceptions, log it and exit
     * anyways.
     */
    process.on('uncaughtexception', handleError.bind(null, 'uncaughtexception'));
    process.on('rejectionHandled', handleError.bind(null, 'rejectionHandled'));
    process.on('unhandledRejection', handleError.bind(null, 'unhandledRejection'));
    process.on('exit', cleanup.bind(null, 'exit', 0));
    process.on('SIGINT', cleanup.bind(null, 'SIGINT', 0));
    process.on('SIGTERM', cleanup.bind(null, 'SIGTERM', 0));

    /*
     * TODO: We could provide better error messages
     *       when possible.
     *
     * Error:
     *  TypeError: Cannot assign to read only property '<moduleid>' of object '#<Application>'
     * Message:
     * The application context already has a property named "<moduleid>".
     * If you are trying to overwrite it, then use the `context.provide`
     * function instead of a direct assignment.
     */
    function handleError(label, err) {

        if (arguments.length === 1) {
            err = label;
            label = 'Unkown';
        }

        app.logger.error('We catched an unhandled error: <%s>', label);
        app.logger.error(err);
        cleanup('ERROR', 1);
    }

    app.resolve('monitoring').then(function(monitoring) {
        monitoring.signals.on('shutdown', function(event) {
            cleanup(event.signal, event.data && isNaN(event.data) ? 1 : event.data);
        });
    });

    function cleanup(label, code) {
        if (cleanup.visited) return;

        cleanup.visited = true;

        //TODO: This should be namespaced! coreio.closing
        app.emit('closing', {
            code,
            label
        });

        /*
         * Here we stll might have 10 seconds to go, or whatever
         * is Serene's timeout value.
         */
        app.close(code, label).then(function() {

            app.logger.warn('\nCLEANUP reason : %s code: %s', label, code);

            /*
             * For now, we are ignoring the code, since
             * exit(0) ensures that our app gets restarted
             * by docker.
             */
            process.exit(0);
        });
    }

    return handleError;
};
