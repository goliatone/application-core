/*jshint esversion:6, node:true*/
'use strict';

module.exports =  function solveRequireDependencies(beanId, target, dependencies){
    console.log('========>> ', beanId, target, dependencies);
    try{
        dependencies.map(function(bean){
            console.log('desp for ', bean);
            if(!target || !target[bean]){
                if(typeof bean === 'string')
                    bean = {id:bean, options:{setter:bean}};
                console.log('try to solve ', bean.id, bean.options.setter);

                var beanId = bean.id,
                    setter = bean.options.setter,
                    value;

                //Use require to find the module!!
                value = require(beanId);

                console.log('- solveRequireDependencies: %s', beanId);

                if(typeof setter === 'function'){
                    setter.call(target, value, beanId);
                } else if( typeof setter === 'string'){
                    target[setter] = value;
                }

                else console.warn('WE DONT HAVE A SETTER');
                //TODO: We should treat this as an array
                //TODO: This should be the 'initialize' phase!
                // if(this.postKey in options) options[this.postKey].apply(scope, options[this.postArgs]);
            } else {
                console.log("\n**********---------************\nBEAN: %s\nVALUE: %s\n----",
                    bean,
                    JSON.stringify(target[bean], null, 4)
                );
            }
        }, this);
    } catch(e){
        console.log('==============================');
        console.error('ERROR DEPS', e.message);
        console.log('==============================');
    }
};
