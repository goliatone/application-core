'use strict';

const request = require('request-promise');

module.exports = function(app, config) {
    app.logger.info('Registering application...');

    /*
     * We chose a different endpoint based on
     * the intention of the call, we are either
     * registering or unregistering...
     */
    let url = `${config.url}/api/`;
    url += config.register ? 'register' : 'unregister';

    let body = config.register ? config.data : {};

    /*
     * If we have an identifier then we
     * send it regardless of us registering
     * or unregistering.
     */
    if(app.registry.identifier) {
        body.identifier = app.registry.identifier;
    }

    app.logger.info('URL: %s', url);
    app.logger.info('DATA: %j', body);

    return request({
        method: 'POST',
        uri: url,
        body: body,
        json: true,
        //we might want to take custom headers from
        //config, like if we needed a token to register.
        headers: {
            'content-type': 'application/json',
        }
    }).then((result = {success: false, value: {}}) => {

        if(!config.register) return;

        app.logger.info('Registry response...');
        app.logger.info('success: %s value: %j', result.success, result.value);
        app.logger.info(result);

        if(result.success) {
            app.logger.info('Session identifier: %s', result.value.identifier);
            app.registry.identifier = result.value.identifier;
        }
    })
    .catch((err) => {
        if(err.code = 'ECONNREFUSED') {
            app.logger.info('Registry service down. Unable to register.');
        } else {
            app.logger.error('Error registering application...');
            app.logger.error(err);
        }
    });
};
