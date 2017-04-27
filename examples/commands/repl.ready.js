'use strict';
/*
 * Attach the application instance to
 * the REPLs context.
 */
module.exports = function replReady(repl) {
    this.getLogger('repl').warn('command: repl.ready');


    var myModule = {};
    myModule.logger = this.getLogger('myModule');
    myModule.sayHello = function(){
        myModule.logger.info('Greetings from the REPL side');
        return 'Hi! Look at the output in the core.io app console';
    };
    repl.context.app = this;
    repl.context.myModule = myModule;
};
