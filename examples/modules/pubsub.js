module.exports.init = function(core, config){
    var pubsub = {};

    return new Promise(function(resolve, reject) {
        resolve(pubsub);
        core.getLogger('pubsub').info('Pubsub module loaded: %s', JSON.stringify(config));
    });
};
