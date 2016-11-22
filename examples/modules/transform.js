/*jshint esversion:6*/
'use strict';
module.exports.init = function(core, config){

    var transform = {
        apply: function(){}
    };

    core.resolve('pubsub').then(()=>{
        core.getLogger('transform').info('Transform solved dependency.');
    });

    core.getLogger('transform').info('Transform module loaded.');

    return transform;
};
module.exports.priority = -1;
