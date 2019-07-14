'use strict';

module.exports.init = function(context, config){
    context.getLogger('media').info('Initialize media module...');

    let media = {};
    media.upload = function(data){
        context.getLogger('media').info('request media upload...');
        context.emit('media.upload', data);
    };

    return new Promise(function(resolve, reject) {
        //We could also register commands this way...
        // context.loadModuleCommands(config.moduleid).then(()=>{
            resolve(media);
        // });
    });
};
