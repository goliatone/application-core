/*jshint esversion:6, node:true*/
"use strict";

var extend = require('gextend');
var Serene = require('./signals');
var CareTaker = require('./health');

module.exports.init = function(app, config) {
    /*
     * CareTaker ensures that the service is
     * getting data. It could be that either
     * bouncer or CloudAMQP is down and we
     * get no events. If that's the case,
     * we try to restart the service.
     *
     * This is due to ascoltatori/AMQP being
     * finicky about the order of subscription,
     * if a Bouncer instance goes down and restarts
     * then we have to register a listener again.
     */
    var health = new CareTaker({
        logger: app.logger,
        autorun: config.autorun,
        timeout: '32 minutes 23 seconds',
        /*
         * we store our last ACTIVITYID by PARTNAME
         * before we exit we save a record
         */
        serializer: function(data) {
            var out = extend({}, this.bequest),
                value = data.PARTNAME || false,
                key = data.NODEADDRESS + ':' + data.ACTIVITYID || false;

            if(!key || !value) return out;

            out[key] = value;

            return out;
        }
    });

    health.on('terminate', function(e) {
        app.logger.warn('Termiating application due to error.');
        app.logger.warn('Error mesasge');
        app.errors(e);
    });

    var signals = new Serene({

    });

    app.emit('monitoring.ready');

    return {
        health,
        signals
    };
};
