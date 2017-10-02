'use strict';

function MediaUploadCommand(event) {
    let logger = event.context.getLogger('media-upload');
    logger.info('MediaUploadCommand execute...');
}


module.exports = MediaUploadCommand;
