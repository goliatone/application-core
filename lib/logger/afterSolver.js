/*jshint esversion:6, node:true*/
'use strict';

module.exports =  function afterSolver(config){
    var prefix = config.logger.filenamePrefix,
        dirname = config.logger.dirname;

    config.logger.transports.map((tr)=> {

        if(prefix){
            tr._basename = tr.filename = prefix + '-'+ tr.filename;
        }

        if(dirname) {
            tr.dirname = config.logger.dirname;
        }
    });

    config.logger.exceptionHandlers.map((tr)=> {

        if(prefix){
            tr._basename = tr.filename = prefix + '-'+ tr.filename;
        }

        if(dirname) {
            tr.dirname = config.logger.dirname;
        }
    });
};
