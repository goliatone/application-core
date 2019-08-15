/*jshint esversion:6, node:true*/
"use strict";

var extend = require('gextend');
var human = require('human-time');
var _inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('shutdown');
const logger = require('noop-console').logger();

/*
 * SIGINT: Sent from CTRL+C, not generated on
 * 		   terminal set to raw mode.
 * SIGQUIT: Sent from keyboard quit action.
 * SIGTERM: Sent from operating system kill.
 * SIGBREAK: CTRL+Break, Windows only.
 *
 * For a full list of signals, run `kill -l`
 * on a *nix machine.
 */
var DEFAULTS = {
    autoinitialize: true,
    signals: [
        'SIGINT',
        'SIGHUP',
        'SIGTERM',
        'SIGQUIT',
        'SIGBREAK',
        'uncaughtException'
    ],
    handlers: [],
    timeout: 1 * 1000,
    // timeout: 10 * 1000,
    defaultExitCode: 0,
    logger,
    getProcess: function() {
        return process;
    }
};

/**
 * TODO: Move to it's own package. Require inside
 *       errors core module.
 *
 * Serene, graceful and controlled shutdowns.
 *
 * http://joseoncode.com/2014/07/21/graceful-shutdown-in-node-dot-js/
 *
 * Process managers usually will send first a
 * SIGTERM and wait 10* seconds, if the process
 * is still running a SIGKILL gets sent.
 *
 * upstart:     SIGTERM - 5  secs - SIGKILL
 * runit:       SIGTERM - 10 secs - SIGKILL
 * heroku:      SIGTERM - 10 secs - SIGKILL
 * docker:      SIGTERM - 10 secs - SIGKILL
 * supervisord: SIGTERM - 10 secs - SIGKILL
 *
 *
 * @param {Object} config Config object
 */
function Serene(config) {

    if (!(this instanceof Serene)) {
        return new Serene(config);
    }

    config = extend({}, DEFAULTS, config);

    EventEmitter.call(this);

    if (config.autoinitialize) this.init(config);

}
_inherits(Serene, EventEmitter);


Serene.prototype.init = function(config) {
    if (this.intialized) return this;
    this.initialized = true;

    config = extend({}, DEFAULTS, config);

    extend(this, config);

    this.handlers.map(function(handler) {
        this.on('shutdown', handler.bind(this));
    }, this);

    this.process = this.getProcess();

    this.upon(this.signals);

    return this;
};

Serene.prototype.upon = function(signals) {
    signals = signals || DEFAULTS.signals;

    //I really dislike self, but no bind here
    var self = this;

    function once(signal, codeOrError) {
        if (once.ran) return;
        once.ran = true;

        try {
            self._onShudtdown({
                signal: signal,
                data: codeOrError
            });
        } catch (e) {
            debug(e);
            self.exit(1);
        }

        signals.map(function(signal) {
            self.process.removeListener(signal, once);
        });
    }

    signals.map(function(signal) {
        this.logger.info('processing shutdown handler for %s', signal);
        this.process.on(signal, once.bind(once, signal));
    }, this);
};

Serene.prototype._onShudtdown = function(event) {
    if (this.shuttingdown) return;

    this.logger.warn('\nSERENE: Got "%s", start shudown process', event.signal);

    this.logger.warn('SERENE: Timeout will execute in %s',
        human(-1 * this.timeout / 1000)
    );

    if (event.data instanceof Error) {
        this.logger.error('SERENE: Exit due an uncaught exception, %s', event.data.message);
        this.logger.error(event.data);
        if (event.data && event.data.stack) {
            this.logger.error(event.data.stack);
        }
    }

    this.shuttingdown = true;

    this.timeoutId = setTimeout(function() {
        this.exit(1);
    }.bind(this), this.timeout);

    this.emit('shutdown', event);
};

Serene.prototype.exit = function(code) {
    code = code === undefined ? this.defaultExitCode : code;

    this.logger.warn('Request exit, code %s', code);

    clearTimeout(this.timeoutId);

    this.process.exit(code);
};

module.exports = Serene;
