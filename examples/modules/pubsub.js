module.exports.init = function(core, config){
    core.getLogger('pubsub').info('Pubsub module loaded: %s', JSON.stringify(config));
};
