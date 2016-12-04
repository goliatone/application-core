/*jshint esversion:6, node:true*/
'use strict';

class JSONParser {
    constructor(manager) {
        manager.parser('json', this.parse.bind(this));
    }

    /**
     * Parse JSON into an array of results. Assumes top-level is array, unless
     *  opts.key is provided to pick a top-level key from parsed object as results.
     * @param {string} contents
     * @param {object} options
     */
    parse(contents, opts) {
        if(typeof contents === 'object') return contents;
        let results = JSON.parse(contents);
        if (opts.key) results = results[opts.key];
        return results;
    }
}

module.exports = JSONParser;
