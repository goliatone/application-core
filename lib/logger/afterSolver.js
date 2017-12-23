'use strict';

/**
 * Function to execute after all configuration
 * references have been solved.
 * 
 * @memberof core/logger
 * @param {Object} config Configuration object
 * @param {Object} config.logger Logger options
 * @param {Object} config.logger.filenamePrefix 
 * @param {Object} config.logger.dirname 
 */
function afterSolver(config) {

    let prefix = config.logger.filenamePrefix,
        dirname = config.logger.dirname;

    config.logger.transports.map((tr)=> {

        if(prefix) {
            tr._basename = tr.filename = prefix + '-'+ tr.filename;
        }

        if(dirname) {
            tr.dirname = config.logger.dirname;
        }
    });

    config.logger.exceptionHandlers.map((tr)=> {

        if(prefix) {
            tr._basename = tr.filename = prefix + '-'+ tr.filename;
        }

        if(dirname) {
            tr.dirname = config.logger.dirname;
        }
    });
}

module.exports = afterSolver;
