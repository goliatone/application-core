/*jshint esversion:6, node:true*/
'use strict';

var REPL = require('poke-repl');

/* Use poke-repl to create a TCP repl.
 */
module.exports.init = function(context, config){
    const _logger = context.getLogger('repl');

    var enabled = context.config.get('repl.enabled', false);

    if(enabled === false){
        return _logger.warn('Module "repl" is disabled!');
    }

    var options = config;
    options.root = context.basepath;
    options.logger = _logger;

    _logger.debug('Configuration for module "repl"...');

    var repl = new REPL(options);
    
    context.on('run.post', () => {
        _logger.debug('Module "repl" ready...');
        repl.listen();
        repl.context.app = context;
        context.emit('repl.ready', repl);
    });
};
