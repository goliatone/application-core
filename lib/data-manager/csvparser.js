'use strict';
const parse = require('csv-parse');

class CSVParser {
    constructor(manager){
        manager.parser('csv', this.parse.bind(this, ','));
        manager.parser('tsv', this.parse.bind(this, '\t'));
    }

    parse(delimiter, contents, opts={delimiter:','}) {
        var delimiter = opts.delimiter || delimiter
        return new Promise((resolve, reject) => {
            parse(contents, {delimiter: delimiter, trim: true}, (err, data) => {
                if (err) return reject(err)
                var header = data.shift();
                var results = data.map((row) => {
                    row = row.map((r) => {if(r.trim) r = r.trim(); return r})
                    var out = {}, i = 0;
                    header.map((key) => out[key] = row[i++]);
                    return out;
                });
                resolve(results);
            });
        });
    }
}
module.exports = CSVParser;

// var p = new CSVParser();
// var path = __dirname + '/location.csv';
// var contents = require('fs').readFileSync(path, 'utf-8');
// p.parse(',', contents).then(console.log);
