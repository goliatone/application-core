/*jshint esversion:6, node:true*/
'use strict';

const stringifier = require('csv-stringify');

class CSVExporter {
    constructor(manager){
        manager.exporter('csv', this.export.bind(this, ','));
        manager.exporter('tsv', this.export.bind(this, '\t'));
    }

    export(delimiter, records, options={}){
        options.delimiter = options.delimiter || delimiter;

        if (!options.header) options.header = true;

        var defer = Promise.defer();

        //TODO: we should iterate over records and make sure we don't
        //have populated relationships, and if we do, then show just the
        //id

        stringifier(records, options, function(err, out){
            if(err) defer.reject(err);
            defer.resolve(out);
        });

        return defer.promise;
    }
}
module.exports = CSVExporter;
