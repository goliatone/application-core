'use strict';

module.exports = function replReady(repl){
    this.logger.warn('REPL ready');
    repl.context.app = this;
};
