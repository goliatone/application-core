'use strict';

//https://github.com/parshap/node-sanitize-filename
function sanitizeName(name=''){
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

    name = toCamelCase(name);

    return name;
}

module.exports.sanitizeName = sanitizeName;

const path = require('path');

function getModuleName(file){
    return path.basename(file).replace(path.extname(file), '');
}

module.exports.getModuleName = getModuleName;


function getPathToMain(){
    var sep = path.sep;
    var main = process.argv[1];
    main = main.split(sep);
    main.pop();
    main = main.join(sep);
    return main;
}

module.exports.getPathToMain = getPathToMain;

function getListenerCount(emitter, type){
    let listeners = emitter.listeners(type).length - 1;
    return listeners === -1 ? 0 : 1;
}

module.exports.getListenerCount = getListenerCount;
