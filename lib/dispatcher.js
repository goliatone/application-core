/*jshint esversion:6*/
'use strict';

const EventEmitter = require('events');
var emitter = new EventEmitter();
var Promise = require('bluebird');

module.exports.init = function(app, config){

    app.chainEvents = chainEvents(app);

    app.hook = createHook(app, {
        //TODO: Should we expose this as well?
        //      should we get if from config?!
        pre: function(h){ return h + '.' + 'pre';},
        post: function(h){ return h + '.' + 'post';},
        done: function(h){ return h + '.' + 'complete';},
    });

    app.getLogger('dispatcher').debug('dispatcher ready');
    app.emit('dispatcher.ready');

    return emitter;
};


function createHook(emitter, config){
    return function(hook, ...args){

        var list = () => emitter.listeners(hook);
        var pre  = () => emitter.listeners(config.pre(hook));
        var post = () => emitter.listeners(config.post(hook));

        function _reducer(){
            return (accumulator, fn)=>{
                /*
                 * if our current handler does not return a
                 * Promise but a value then we can still handle
                 * it. If it returns nothing, we return the accumulator
                 * value.
                 */
                return Promise.resolve(fn.apply(emitter, accumulator)).then((_)=>{
                    return accumulator;
                });
            };
        }

        /*
         * All event handlers should have the same signature.
         * Also, it's best to use the form:
         * emitter.emit(type, event);
         * Non Promise values returned from each handler are ignored.
         * Modify the data sent to the handler.
         */
        return Promise.reduce(pre(), _reducer(), args).then((nargs)=>{
            if(!Array.isArray(nargs)) nargs = [nargs];
            return Promise.all(list().map((fn)=>{
                let val = fn.apply(emitter, nargs);
                return Promise.resolve(val);
            })).then((_)=>{
                return Promise.resolve(args);
            });
        }).then((results)=>{
            /*
             * Here we need to fix arguments
             * so we can process them properly.
             * We are effectively undoing the
             * Promise.resolve(...args);
             */
            results = results[0];
            return Promise.reduce(post(), _reducer(), results).then((res)=>{
                /*
                 * We want to add event type and
                 * payload together.
                 */
                let args = [config.done(hook)].concat([res]);
                emitter.emit.apply(emitter, args);
                return res;
            });
        });
    };
}

function chainEvents(emitter){

    function promiseFromEventChain(eventsResolve, eventsReject){
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

            function resolveHandler(event, ...args){
                eventsResolve.splice(eventsResolve.indexOf(event, 1), 1);

                if(eventsResolve.length > 0) return;

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
            for(let event of eventsResolve){
                emitter.addListener(event, resolveHandler.bind(emitter, event));
            }
        });
    }

    return promiseFromEventChain.bind(emitter);
}
