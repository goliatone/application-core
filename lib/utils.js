'use strict';
const path = require('path');

/**
 * Naive filename sanitize function.
 *
 * @link https://github.com/parshap/node-sanitize-filename
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
 * @param  {String} [file=''] Path to module.
 * @return {String}           Module name.
 */
function getModuleName(file='') {
    return path.basename(file).replace(path.extname(file), '');
}

/**
 * Get path to main module.
 * @return {String}
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


const VError = require('verror');

module.exports.fullStack = VError.fullStack;
/**
 * Utility function to clean up names.
 *
 * @type {Function}
 * @exports sanitizeName
 */
module.exports.sanitizeName = sanitizeName;

/**
 * Utility function to get name from file
 * path.
 *
 * @type {Function}
 * @exports getModuleName
 */
module.exports.getModuleName = getModuleName;

/**
 * Utility function to get path to
 * directory from which we run.
 *
 * @type {Function}
 * @exports getPathToMain
 */
module.exports.getPathToMain = getPathToMain;

/**
 * Get number of listener functions an
 * event has.
 *
 * @type {Function}
 * @exports getListenerCount
 */
module.exports.getListenerCount = getListenerCount;
