/*jshint esversion:6, node:true*/
'use strict';
const extend = require('gextend');


/** 
 * https://www.npmjs.com/package/data-mask
 * @memberof core/Logger
*/
class Filter {
    constructor(config){
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
