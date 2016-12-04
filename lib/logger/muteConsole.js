'use strict';

const noopConsole = require('noop-console');


module.exports = function(app, config){

    noopConsole(console);

    /**
     * Add a restore function to app.
     * @return {void}
     */
    app.restoreNativeConsole = function(){
        console._restore();
        console.info('Restoring console...');
        console.info('console OK...');
    };
};
