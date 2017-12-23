/*jshint esversion:6, node:true*/
'use strict';
const extend = require('gextend');


/** 
 * Filter enables masking output from the 
 * Logger class. It enables to remove sensitive
 * content from the output.
 * 
 * https://www.npmjs.com/package/data-mask
 * @memberof core/logger
 * @param {Object} config - Configuration options
*/
class Filter {
    constructor(config) {
        config = extend({}, Filter.DEFAULTS, config);

        if(config.autoinitialize){
            this.init(config);
        }
    }

    init(config){

        extend(this, config);
    }

    run(message){

    }
}

Filter.DEFAULTS = {
    keywords: {
        password: '*',
        username: 'hash'
    }
};

module.exports = Filter;
