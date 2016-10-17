'use strict';
/*
 * Attach the application instance to
 * the REPLs context.
 */
module.exports = function replReady(repl){
    this.logger.warn('REPL ready');
    repl.context.app = this;
};
