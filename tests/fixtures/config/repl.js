'use strict';
const { resolve, join } = require('path');
const filepath = resolve(join(__dirname, 'repl-banner.txt'));
const header = require('fs').readFileSync(filepath, 'utf-8');
const cluster = require('cluster');

module.exports = {
    //    enabled: true,
    enabled: cluster.isMaster,
    metadata: {
        name: 'application-core',
        version: '0.0.0',
        environment: 'development'
    },
    options: {
        prompt: '\u001b[33m ${app.name} > \u001b[39m',
        header: header
    },
    port: process.env.NODE_REPL_PORT || 9090,
    // connectionBanner: connectionBanner
};

function connectionBanner(config) {
    if (config.header) header = header;
    config.environment = config.environment || process.env.NODE_ENV;

    var body = `

 REPL Info:
 Name              : ${config.name}
 Version           : ${config.version}
 Environment       : ${config.environment}

`;
    return header + body;
};