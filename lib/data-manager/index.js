'use strict';

const extend = require('gextend');
const EventEmitter = require('events');

const CSVParser = require('./csvparser');
const CSVExporter = require('./csvexporter');
const JSONParser = require('./jsonparser');
const JSONExporter = require('./jsonexporter');

var DEFAULTS = {
    autoinitialize: true
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

        extend(this, options);
    }

    parser(type, handler){
        this._parsers[type] = handler;
    }

    exporter(type, handler){
        this._exporters[type] = handler;
    }

    export(type, records, options){

    }

    import(type, content, options){

    }

    importAsModels(model, type, content, options){

    }

    importFileAsModels(model, filename, options){

    }
}


module.exports = Manager;
