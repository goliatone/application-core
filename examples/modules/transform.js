/*jshint esversion:6*/
'use strict';
module.exports.init = function(app, config){

    var transform = {
        apply: function(){}
    };

    app.resolve('pubsub').then(()=>{
        app.getLogger('transform').info('Transform solved dependency.');
    });

    app.getLogger('transform').info('Transform module loaded.');

    return transform;
};
module.exports.priority = -1;
