'use strict';

/**
 * Wrap native console with a `logger` instance.
 * 
 * @memberof core/Logger
 * @param  {Object} app    Application core instance.
 * @param  {Object} config Configuration object.
 * @return {void}
 */
module.exports = function wrapConsole(app, config){

    let logger = app.getLogger('console');
    
    console.info = logger.info;
    console.warn = logger.warn;
    console.debug = logger.debug;
    console.error = logger.error;
    console.log = logger.verbose;

    console.log('Wrapped native "console" in logger wrapper...');
};
