'use strict';
const breakString = require('break-string');

function enforceColumnWidth(message) {
    message = message.split('\n');

    message.map( (line, index) => {
        line = line.trim();
        line = breakString(line, 60);
        if(line.length > 1) {
            message[index] = line;
        }
    });

    return (flatten(message));
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
