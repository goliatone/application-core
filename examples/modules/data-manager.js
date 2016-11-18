module.exports.init = function(app, config){
    app.resolve(['transform', 'pubsub']).then((deps)=>{
        app.getLogger('data-manager').info('dataManager: deps loaded', deps[0].moduleid, deps[1].moduleid);
    });
    app.getLogger('data-manager').info('dataManager module loaded: %s', JSON.stringify(config));
};
