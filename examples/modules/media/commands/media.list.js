'use strict';

function MediaListCommand(event) {
    const logger = event.context.getLogger('media-list');
    logger.info('MediaListCommand execute...');
}


module.exports = MediaListCommand;