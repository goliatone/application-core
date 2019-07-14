'use strict';

const { resolve, join } = require('path');
const filepath = resolve(join(__dirname, 'app.banner.txt'));
const banner = require('fs').readFileSync(filepath, 'utf-8');

module.exports = {
    banner,
    name: 'App Kernel',
    environment: process.env.NODE_ENV || 'development',
    loaders: {
        modules: './modules',
        commands: './commands'
    },
    registration: {
        data: {
            health: {
                endpoint: 'http://google.com'
            },
            repl: {
                port: '${repl.port}'
            },
            type: 'socket',
            environment: '${app.environment}',
            hostname: require('os').hostname() + process.env.NODE_ID
        }
    }
};