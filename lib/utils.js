'use strict';

/**
 * Module holding different utilities.
 *  
 * @module core/utils
 */

const path = require('path');

/**
 * Transform a list of files we want into
 * a pattern for multimatch that would
 * exclude files NOT matching those names.
 *
 * @memberof core/utils
 * @param  {Object} options
 * @return {Object}
 */
function makeExcludeFilterFromWantList(options){
    if(options.only) {

        if(!Array.isArray(options.only)) {
            options.only = [options.only];
        }
        /*
         * multimatch pattern to exclude all files
         * except literal matches by name.
         */
        options.only = ['**', `!**/+(${options.only.join('|')}).js`];
    }

    return options;
}

/**
 * Naive filename sanitize function.
 *
 * @link https://github.com/parshap/node-sanitize-filename
 * 
 * @memberof core/utils
 * @param  {String} [name=''] Name to be clean up
 * @return {String}           Sanitized name
 */
function sanitizeName(name='') {
    function toCamelCase(str) {
        // Lower cases the string
        return str.toLowerCase()
            // Replaces any - or _ characters with a space
            .replace( /[-_]+/g, ' ')
            // Removes any non alphanumeric characters
            .replace( /[^\w\s]/g, '')
            // Uppercases the first character in each group immediately following a space
            // (delimited by spaces)
            .replace( / (.)/g, function($1) { return $1.toUpperCase(); })
            // Removes spaces
            .replace( / /g, '' );
    }

    function removeStartingDigits(name=''){
        return name.replace(/^[0-9]+/g, '');
    }

    name = toCamelCase(name);
    name = removeStartingDigits(name);

    return name;
}

/**
 * Return name of module from it's path.
 * 
 * @memberof core/utils
 * @param  {String} [file=''] Path to module.
 * @return {String}           Module name.
 */
function getModuleName(file='') {
    return path.basename(file).replace(path.extname(file), '');
}

/**
 * Get path to main module.
 * 
 * @return {String}
 * @memberof core/utils
 * @static
 */
function getPathToMain() {
    var sep = path.sep;
    var main = process.argv[1];
    main = main.split(sep);
    main.pop();
    main = main.join(sep);
    return main;
}

function isFunction(fn){
    return typeof fn === 'function';
}

module.exports.isFunction = isFunction;

/**
 * Get number of listeners an event emitter
 * has for a given event type.
 * 
 * @memberof core/utils 
 * @param  {Object} emitter
 * @param  {String} type
 * @return {number}
 */
function getListenerCount(emitter, type) {
    if(!emitter) return 0;
    if(typeof emitter.listeners === 'function') return 0;
    let listeners = emitter.listeners(type).length - 1;
    return listeners === -1 ? 0 : listeners;
}

/**
 * Anything that can be executed.
 * @typedef {(Function|Class|Command)} CommandLike
 */

/**
 * Normalize command object.
 * 
 * @memberof core/utils 
 * @param  {CommandLike} command
 * @param  {Object} [config={}]
 * @return {Object}
 */
function normalizeCommandObject(command, config={}){
    if(command.execute) {
        return command;
    } else if(command.prototype && command.prototype.execute) {
        return new command(config);
    }

    /*
     * we assume we have a function.
     * Check!!
     */
    return {
        execute: command
    };
}

const VError = require('verror');

module.exports.fullStack = VError.fullStack;

module.exports.sanitizeName = sanitizeName;

module.exports.getModuleName = getModuleName;

module.exports.getPathToMain = getPathToMain;

module.exports.getListenerCount = getListenerCount;

module.exports.normalizeCommandObject = normalizeCommandObject;

module.exports.makeExcludeFilterFromWantList = makeExcludeFilterFromWantList;
