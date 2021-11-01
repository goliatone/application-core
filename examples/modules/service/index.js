'use strict';

module.exports.init = function(context, config) {
    const logger = context.getLogger(config.moduleid);
    logger.info('Service module start...');
    return {};
};