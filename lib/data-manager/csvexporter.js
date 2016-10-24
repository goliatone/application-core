'use strict';

const stringifier = require('csv-stringify');

class CSVExporter {
    constructor(manager){
        manager.exporter('csv', this.export.bind(this, ','));
        manager.exporter('tsv', this.export.bind(this, '\t'));
    }

    export(delimiter, records, opts={}){
        opts.delimiter = opts.delimiter || delimiter;

        if (!opts.header) opts.header = true;

        var defer = Promise.defer();

        stringifier(records, opts, function(err, out){
            if(err) defer.reject(err);
            defer.resolve(out);
        });

        return defer.promise;
    }
}
module.exports = CSVExporter;
// var e = new CSVExporter();
// var records = [ { uuid: '932476A7-D3E0-4336-AB2F-03204606EE9F',
//     name: 'DC01',
//     description: 'DC Gramercy',
//     index: '100',
//     floorplan: '',
//     parent: '' },
//   { uuid: 'B1205714-E664-4FBC-8D5C-0759A16663B8',
//     name: 'NY15-3FL',
//     description: 'NYC Chelsea 3rd Floor',
//     index: '200',
//     floorplan: '',
//     parent: '57fcfa755351cee4e3a75da5' },
//   { uuid: '',
//     name: 'NY15-4FL',
//     description: 'NYC Chelsea 4th Floor',
//     index: '200',
//     floorplan: '',
//     parent: '57fcfa755351cee4e3a75da5' },
//   { uuid: '',
//     name: 'NY15-5FL',
//     description: 'NYC Chelsea 5th Floor',
//     index: '200',
//     floorplan: '57fd388e5f519d3a045621e7',
//     parent: '57fcfa755351cee4e3a75da5' } ];
// e.export(records).then(console.log)
