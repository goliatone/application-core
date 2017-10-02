'use strict';

class MediaUploadCommand {

    execute(event){
        event.context.getLogger('media').info('execute media upload command...');
    }
}

module.exports = MediaUploadCommand;
