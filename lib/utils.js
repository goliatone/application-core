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