/*jshint esversion:6, node:true*/
'use strict';

const fs = require('fs');
const extend = require('gextend');
const EventEmitter = require('events');

const CSVParser = require('./csvparser');
const CSVExporter = require('./csvexporter');
const JSONParser = require('./jsonparser');
const JSONExporter = require('./jsonexporter');

var DEFAULTS = {
    autoinitialize: true,
    importOptions: {
        truncate: false,
        identityFields: ['id', 'uuid'],
        strict: true,
        updateMethod: 'updateOrCreate'
    },
    modelProvider: function(identity){
        return Promise.reject(new Error('Need to implement'));
    },
    createFileNameFor: function(identity, type){
        var date = '_' + Date.now();
        return identity + date + '.' + type;
    }
};

class Manager extends EventEmitter {
    constructor(config){
        super();
        config = extend({}, DEFAULTS, config);

        if(config.autoinitialize) this.init(config);
    }

    init(options){
        this._parsers = {};
        this._exporters = {};

        new CSVParser(this);
        new CSVExporter(this);
        new JSONParser(this);
        new JSONExporter(this);

        extend(this, options);
    }

    parser(type, handler){
        this._parsers[type] = handler;
    }

    exporter(type, handler){
        this._exporters[type] = handler;
    }

    export(type, records, options={}){
        if(!this._exporters[type]) return Promise.reject(new Error('No matching exporter found: '+ type));
        return Promise.resolve(this._exporters[type](records, options));
    }

    import(type, content, options={}){
        if(!this._parsers[type]) throw new Error('No matching parser found: '+ type);
        return Promise.resolve(this._parsers[type](content, options)).then((results) => {
            results.map((res)=> this.emit('record.' + type, res));
            this.emit('records.'+type, records);
            return results;
        });
    }

    importFile(filename, options={}) {
        var self = this;
        return new Promise(function(resolve, reject) {
            fs.readFile(filename, (err, content) => {
                if(err) return reject(err);
                content = content.toString();
                var type = require('path').extname(filename).replace('.', '');
                if (options && options.type) type = options.type;
                resolve(self.import(type, content, options));
            });
        });
    }

    importAsModels(identity, type, content, options={}){
        return this.import(type, content, options).then((results)=>{
            return this._importModel(identity, results, options);
        });
    }

    importFileAsModels(identity, filename, options){
        return this.importFile(filename, options).then((results)=>{
            return this._importModel(identity, results, options);
        });
    }

    _importModel(identity, items, options={}){
        options = extend({}, this.importOptions, options);

        if(!items) items = [];
        if(typeof items === 'object' && !Array.isArray(items)) items = [items];

        return this.modelProvider(identity).then((Model)=>{
            if(!Model) return Promise.reject(new Error('Model not found'));

            var attributes = Object.keys(Model._attributes);

            var method = options.truncate ? 'create' : 'updateOrCreate';

            console.log('importModel:: update method', method);

            function iterate(records, options, output=[], errors=[]){
                var record = records.pop();
                if(!record){
                    return Promise.resolve(output, errors);
                }

                var criteria = {};
                options.identityFields.map((field)=> {
                    if(record[field]) criteria[field] = record[field];
                });
                console.log('importModel:: criteria', criteria);

                var args = options.truncate ? [record] : [criteria, record];

                console.log('importModel:: args', JSON.stringify(args, null, 4));

                return Model[method].apply(Model, args).then((record) => {
                    console.log('importModel:: result', JSON.stringify(record, null, 4));
                    output.push(record);
                    return iterate(records, options, output, errors);
                }).catch((err)=>{
                    errors.push(err);
                    return iterate(records, options, output, errors);
                });
            }

            if(options.truncate){
                return Model.destroy({}).then(()=> iterate(items, options));
            } else return iterate(items, options);
        });
    }

    exportModels(identity, query={}, type='json', options={}){

        return this.modelProvider(identity).then((Model)=>{
            var orm = Model.find(query.criteria || {} );

            if(query.populate){
                if(typeof query.populate === 'string' || Array.isArray(query.populate)){
                    orm.populate(query.populate);
                } else if(typeof query.populate === 'object'){
                    //TODO: Check we actually have name and criteria :P
                    orm.populate(query.populate.name, query.populate.criteria);
                }
            }
            if(query.skip) orm.skip(query.skip);
            if(query.limit) orm.skip(query.limit);
            if(query.sort) orm.sort(query.sort);

            return orm.then((models)=> {
                return this.export(type, models, options);
            });
        });
    }

    exportModelsToFile(identity, query={}, type='json', options={}){
        var filename = options.filename || this.createFileNameFor(identity, type);
        console.log('filename:', filename);
        return this.exportModels(identity, query, type, options).then((output)=>{
            var defer = Promise.defer();
            fs.writeFile(filename, output, options.fs || 'utf8', function(err){
                if(err) defer.reject(err);
                else defer.resolve(filename);
            });
            return defer.promise;
        });
    }
}


module.exports = Manager;

var m = new Manager();
var records = [ { uuid: '932476A7-D3E0-4336-AB2F-03204606EE9F',
    name: 'DC01',
    description: 'DC Gramercy',
    index: '100',
    floorplan: '',
    parent: '' },
  { uuid: 'B1205714-E664-4FBC-8D5C-0759A16663B8',
    name: 'NY15-3FL',
    description: 'NYC Chelsea 3rd Floor',
    index: '200',
    floorplan: '',
    parent: '57fcfa755351cee4e3a75da5' },
  { uuid: '',
    name: 'NY15-4FL',
    description: 'NYC Chelsea 4th Floor',
    index: '200',
    floorplan: '',
    parent: '57fcfa755351cee4e3a75da5' },
  { uuid: '',
    name: 'NY15-5FL',
    description: 'NYC Chelsea 5th Floor',
    index: '200',
    floorplan: '57fd388e5f519d3a045621e7',
    parent: '57fcfa755351cee4e3a75da5' } ];
// m.export('csv', records, {key:'locations'}).then(console.log);
// m.import('json', JSON.stringify(records));//.then(console.log);

var path = __dirname + '/location.json';
// var path = __dirname + '/location.csv';
m.importFile(path);

m.on('record.json', console.log);
m.on('record.csv', console.log);
