module.exports = {
    name: 'App Kernel',
    environment: 'development',
    loaders: {
        modules: './modules',
        // handlers: './handlers'
        handlers: './handlers/*.js'
    }
};
