'use strict';
/*
 * Attach the application instance to
 * the REPLs context.
 */
module.exports = function replReady(repl){
    this.getLogger('repl').warn('command: repl.ready');
    repl.context.app = this;
};
