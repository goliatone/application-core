/*jshint esversion:6, node:true*/
'use strict';

var REPL = require('poke-repl');

/* Use poke-repl to create a TCP repl.
 */
module.exports.init = function(context, config){
    const _logger = context.getLogger('repl');

    var enabled = context.config.get('repl.enabled', false);

    if(enabled === false) {
        return _logger.warn('Module "repl" is disabled!');
    }

    var options = config;
    options.root = context.basepath;
    options.logger = _logger;

    _logger.debug('Configuration for module "repl"...');

    var repl = new REPL(options);

    /*
     *
     */
    repl.on('error', (err)=>{
        context.handleModuleError('repl', err);
    });

    context.on('run.post', () => {
        _logger.debug('Module "repl" ready...');
        _logger.debug('You can listen the repl at "%s:%s".', repl.config.host, repl.config.port, {
            __meta__: {
                style: 'bold+white+magenta_bg'
            }
        });

        repl.listen();

        //TODO: Make name of exposed context configurable.
        repl.context.app = context;

        //TODO: Expose a method so we dont have to acces `repl.context`
        //      directly to extend it.
        context.emit('repl.ready', repl);
    });

    return repl;
};
