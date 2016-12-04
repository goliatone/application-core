module.exports.init = function(core, config){

    core.resolve(['transform', 'pubsub']).then((deps)=>{
        core.getLogger('data-manager').info('data-manager: deps loaded', deps[0].moduleid, deps[1].moduleid);
    });

    core.getLogger('data-manager').info('Module "data-manager" loaded: %s', JSON.stringify(config));

    return {};
};

module.exports.dependencies = ['transform', 'pubsub'];
