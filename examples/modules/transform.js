'use strict';
module.exports.init = function(app, config){
    console.log('Transform module', config);
    app.transform = {hello: function(){}};
    app.getLogger('transform').info('Transform module');
};
