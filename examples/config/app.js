
const banner = require('fs').readFileSync('./config/app.banner.txt', 'utf-8');

module.exports = {
    banner,
    name: 'App Kernel',
    environment: 'development',
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
