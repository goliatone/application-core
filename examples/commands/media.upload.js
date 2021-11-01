'use strict';

class MediaUploadCommand {

    execute(event) {
        const logger = event.context.getLogger('media-upload');
        logger.info('MediaListCommand execute...');
        logger.info('execute media upload command...');
    }
}

module.exports = MediaUploadCommand;