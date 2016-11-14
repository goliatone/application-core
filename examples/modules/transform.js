'use strict';
module.exports.init = function(app, config){

    var transform = {
        apply: function(){}
    };

    app.getLogger('transform').info('Transform module loaded.');

    return transform;
};
