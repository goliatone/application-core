'use strict';


class ContextReadyCommand {
    execute(event) {
        const context = event.context;
        const logger = context.getLogger('app-run');
        logger.info('Context ready command...');
        context.dispatch('media.upload');
        context.dispatch('media.list');
    }

}

ContextReadyCommand.ID = 'ContextReadyCommand';

module.exports = ContextReadyCommand;