'use strict';
const breakString = require('break-string');

/**
 * Enforce a column width of length `length`
 * @param  {String} message     Message string
 * @param  {Number} [length=90] Column width
 * @return {Array}
 */
function enforceColumnWidth(message, length=90) {
    message = message.split('\n');

    message.map( (line, index) => {
        line = line.trim();
        line = breakString(line, length);
        if(line.length > 1) {
            message[index] = line;
        }
    });

    return flatten(message);
}

function flatten (arr) {
    let out = [], temp;
    for (var i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
            temp = flatten(arr[i]);
            temp.forEach(v => out.push(v));
        } else {
            out.push(arr[i]);
        }
    }

    return out;
}

function trim(arr) {
    return arr.map(s => s.trim());
}

module.exports.enforceColumnWidth = enforceColumnWidth;
