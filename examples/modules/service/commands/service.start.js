'use strict';


class ServiceStartCommand {
    execute(event) {
        const context = event.context;
        const logger = context.getLogger('svc-start');
        logger.info('Service start command...');
    }
}

ServiceStartCommand.ID = 'ServiceStartCommand';

module.exports = ServiceStartCommand;