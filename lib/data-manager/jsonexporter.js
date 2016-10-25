/*jshint esversion:6, node:true*/
'use strict';

class JSONExporter {
    constructor(manager){
        manager.exporter('json', this.export.bind(this));
    }

    export(records, options) {
        if (options.key) {
            let obj = {};
            obj[options.key] = records;
            records = obj;
        }
        return JSON.stringify(records);
    }
}
module.exports = JSONExporter;
