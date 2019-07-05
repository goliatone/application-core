'use strict';
/** 
 * The repl module provides a REPL interface
 * to your Application instance.
 * 
 * @module core/repl 
 */



const REPL = require('poke-repl');

/**
 * This enables connecting to your application 
 * using a terminal.
 * 
 * Use poke-repl to create a TCP repl server,
 * to which you can connect using a the 
 * [poke-repl](http://github.com/goliatone/poke-repl) client.
 * 
 * The REPL serer supports a rudimentary firewall and authentication
 * mechanism.
 * 
 * REPL header:
 * ```
 * ╔═════════════════════════════════════════════════════════════════════╗
║                      poke-repl remote console √                     ║
║                                                                     ║
║              All connections are monitored and recorded             ║
║      Disconnect IMMEDIATELY if you are not an authorized user       ║
╚═════════════════════════════════════════════════════════════════════╝

 * ```
 * 
 * 
 * 
 * @see {@link http://github.com/goliatone/poke-repl|Poke-REPL}
 * 
 * @memberof core/repl
 * @param {Application} context Application context.
 * @param {Object} config Configuration object.
 * @param {Number} [config.port=8989]  Port exposed by the REPL server.
 * @param {String} [config.host='localhost'] Host of the REPL server.
 * @param {Boolean} [config.enabled=false] Should the REPL be enabled.
 * @param {Object} config.metadata Object passed to render the REPL banner. 
 *                                 This depends on what the banner you use expects.
 * @param {Object} config.metadata.name
 * @param {String} config.metadata.version
 * @param {String} config.metadata.environment
 * @param {Object} config.options 
 * @param {Object} [config.options.prompt='${app.name}'] This string will be the prompt
 *                                                      shown to clients on connect. 
 *                                                      Accepts ANSI colors 
 * @param {Object} [config.options.header]
 */
module.exports.init = function(context, config) {
    const _logger = context.getLogger('repl');

    var enabled = context.config.get('repl.enabled', false);

    if (enabled === false) {
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
    repl.on('error', (err) => {
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

        /**
         * the application context changed,
         * we should reload the connection.
         *
         * There should be a repl command to
         * reload/refresh the connection.
         */
        context.on('context.invalidated', () => {
            _logger.info('Update content invalidated. Reload REPL module');
            repl.updateContext('app', context);
        });
    });

    return repl;
};