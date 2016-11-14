module.exports.init = function(app, config){
    app.getLogger('pubsub').info('Pubsub module loaded: %s', JSON.stringify(config));
};
