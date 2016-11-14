/*jshint esversion:6*/
'use strict';

const EventEmitter = require('events');
var emitter = new EventEmitter();

module.exports.init = function(app, config){
    app.chainEvents = promisifyEvents.bind(null, app);

    app.logger.debug('dispatcher ready');

    return emitter;
};


function promisifyEvents(emitter, eventsResolve, eventsReject){
    if(!Array.isArray(eventsReject)) eventsReject = [eventsReject];
    if(!Array.isArray(eventsResolve)) eventsResolve = [eventsResolve];

    function filterNull(arr){
        return arr.filter( x => !!x);
    }

    eventsReject = filterNull(eventsReject);
    eventsResolve = filterNull(eventsResolve);

    return new Promise((resolve, reject)=>{
        function removeListeners(){
            for( let event of eventsReject){
                emitter.removeListener(event, rejectHandler);
            }
            for( let event of eventsResolve){
                emitter.removeListener(event, resolveHandler);
            }
        }

        function resolveHandler(...args){
            removeListeners();
            if(args.length > 1) resolve(args);
            else resolve(...args);
        }

        function rejectHandler(...args){
            removeListeners();
            if(args.length > 1) reject(args);
            else reject(...args);
        }

        for(let event of eventsReject) emitter.addListener(event, rejectHandler);
        for(let event of eventsResolve) emitter.addListener(event, resolveHandler);
    });
}
