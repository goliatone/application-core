/*jshint esversion:6*/
'use strict';
const extend = require('gextend');
const EventEmitter = require('events');
var emitter = new EventEmitter();
var Promise = require('bluebird');

module.exports.init = function(app, config) {

    app.chainEvents = chainEvents(app);

    app.hook = createHook(app);

    app.getLogger('dispatcher').info('Module "dispatcher" ready...');

    /**
     * @TODO This is not necessary! remove
     */
    app.emit('dispatcher.ready');

    return emitter;
};

/**
 * Creates a wrapper function that will make hooks.
 * This function will wrap an event emitter instance
 * with a hook function
 *
 * A _hook_ is like an event but with a Lifecycle.
 *
 * A hook has four stages:
 * - pre
 * - post
 * - execution
 * - complete
 *
 * You emit a hook the using the `hook`
 * method of your emitter.
 *
 * You register listeners to each stage.
 *
 * @param  {Object} emitter EventEmitter instance
 * @param  {Object} config  Options object
 * @return {Function}
 */
function createHook(emitter, config) {

    config = extend({}, config, {
        //TODO: Should we expose this as well?
        //      should we get if from config?!
        pre: function(h){ return h + '.' + 'pre';},
        post: function(h){ return h + '.' + 'post';},
        done: function(h){ return h + '.' + 'complete';},
    });

    return function $hookWrapper(hook, ...args) {

        var list = () => emitter.listeners(hook);
        var pre  = () => emitter.listeners(config.pre(hook));
        var post = () => emitter.listeners(config.post(hook));

        function _reducer() {
            return (accumulator, fn) => {

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
         *
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

/**
 * Function wraps emitter with a chainEvent function.
 * A chain event will listen for a list of events and
 * resolve when all are triggered.
 * It will
 * @param  {Object} emitter EventEmitter
 * @return {Function}
 */
function chainEvents(emitter) {

    function promiseFromEventChain(eventsResolve, eventsReject) {
        if(!Array.isArray(eventsReject)) eventsReject = [eventsReject];
        if(!Array.isArray(eventsResolve)) eventsResolve = [eventsResolve];

        function filterNull(arr) {
            return arr.filter( x => !!x);
        }

        eventsReject = filterNull(eventsReject);
        eventsResolve = filterNull(eventsResolve);

        let argumentList = [];

        return new Promise((resolve, reject) => {
            function removeListeners() {
                for( let event of eventsReject) {
                    emitter.removeListener(event, rejectHandler);
                }
                for( let event of eventsResolve){
                    emitter.removeListener(event, resolveHandler);
                }
            }

            function resolveHandler(event, ...args) {
                eventsResolve.splice(eventsResolve.indexOf(event, 1), 1);

                argumentList = argumentList.concat(args);

                if(eventsResolve.length > 0) return;

                removeListeners();

                resolve(argumentList);
            }

            function rejectHandler(...args) {
                removeListeners();
                reject(args);
            }

            for(let event of eventsReject) emitter.addListener(event, rejectHandler);
            for(let event of eventsResolve) {
                emitter.addListener(event, resolveHandler.bind(emitter, event));
            }
        });
    }

    return promiseFromEventChain.bind(emitter);
}

/**
 * Wraps a chain of events in a Promise.
 * @type {Function}
 * @exports
 */
module.exports.createHook = createHook;

/**
 * Wraps a chain of events in a Promise.
 * @type {Function}
 * @exports
 */
module.exports.chainEvents = chainEvents;
