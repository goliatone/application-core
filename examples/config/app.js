
const banner = require('fs').readFileSync('./config/app.banner.txt', 'utf-8');

module.exports = {
    banner,
    name: 'App Kernel',
    environment: 'development',
    loaders: {
        modules: './modules',
        commands: './commands'
    },
    loadModulesOptions: {
        only: ['transform', 'pubsub']
    }
};
