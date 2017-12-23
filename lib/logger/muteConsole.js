'use strict';

const noopConsole = require('noop-console');

/**
 * Utility function to mute the native console.
 * It adds a `restoreNativeConsole` method to
 * the Application instance `context`.
 * 
 * @memberof core/Logger
 * @param {Application} context - Application context
 * @param {Object} config - Configuration object 
 */
function muteConsole(context, config) {

    noopConsole(console);

    /**
     * Add a restore function to app.
     * This method is added to Application by
     * the `muteConsole`.
     * 
     * @link core/Logger#muteConsole
     * @memberof Application
     * @return {void}
     */
    context.restoreNativeConsole = function(){
        console._restore();
        console.info('Restoring console...');
        console.info('console OK...');
    };
}

module.exports = muteConsole;
