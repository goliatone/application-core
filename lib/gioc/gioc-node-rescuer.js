/*jshint esversion:6, node:true*/
'use strict';

module.exports = function nodeRescuer(beanId, options){
    console.log('rescue');
    var lib;
    try {
        lib = require(beanId);
        if(options.construct){
            var args = options.args,
                scope = options.scope;
            if(args && !Array.isArray(args)) args = [args];
            lib = lib.apply(scope, args);
        }
    } catch(e){
        console.log(beanId, e.message);
    }

    return lib;
};
