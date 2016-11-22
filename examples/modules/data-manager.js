module.exports.init = function(core, config){
    core.resolve(['transform', 'pubsub']).then((deps)=>{
        core.getLogger('data-manager').info('dataManager: deps loaded', deps[0].moduleid, deps[1].moduleid);
    });
    core.getLogger('data-manager').info('dataManager module loaded: %s', JSON.stringify(config));
};
