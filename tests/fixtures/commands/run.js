'use strict';

module.exports = function runHanlder(){
    this.logger.warn('runHandler: Running application!!');
    this.getLogger('transform').info('Calling transform logger from runHandler');
};
