/*jshint esversion:6, node:true*/
/*
 * Application Core
 * https://github.com/goliatone/application-core
 *
 * Copyright (c) 2016 goliatone
 * Licensed under the MIT license.
 */
'use strict';

const path = require('path');
const glob = require('glob');
const extend = require('gextend');
const EventEmitter = require('events');

const DEFAULTS = {
    logger: console,
    autorun: true,
    autoinitialize: true,
    name: 'Application',
    coremodules:['logger', 'errors', 'dispatcher', 'monitoring', 'repl'],
    basepath: __dirname
};

class Application extends EventEmitter {
    constructor(options){
        options = extend({}, DEFAULTS, options);

        super();

        this.name = 'Application';
        if(options.autoinitialize) this.init(options);
    }

    init(config) {
        if(this.initialized) return;
        this.initialized = true;

        config = extend({}, DEFAULTS, config);

        // this._instances = {};

        extend(this, config);


        //FIGURE OUT HOW TO MERGE...
        this.coremodules.map((module) => {
            this.loadModule(module, path.resolve(path.join(__dirname, module)));
        });
        console.log('done');
    }

    register(instance, name){
        console.log('- registering "%s"', name);
        this[name] = instance;
    }

    loadDirectory(dir, options){
        if(!path.isAbsolute(dir)){
            dir = path.join(getPathToMain(), dir);
        }

        console.log('load directory %s', dir);

        var files = glob.sync(dir, options);
        files.map((file) =>{
            this.loadModule(getModuleName(file), file);
        });
    }

    loadHanlders(dir='handlers', options={}){
        if(!path.isAbsolute(dir)){
            dir = path.join(getPathToMain(), dir);
        }
        var pattern = dir;

        console.log('- load handlers %s', dir);

        var files = glob.sync(pattern, options);

        files.map((file) => {
            this.handle(getModuleName(file), require(file));
        });
    }

    loadModule(id, path){
        // this.logger.info('- loading module "%s", %s', id, path);
        console.info('- loading module "%s", %s', id, path);

        var instance;

        try {
            // instance = require(path).init(this, {});
            instance = require(path).init(this, this.config.get(id, {}));
        } catch (e) {
            console.error('ERROR loading module "%s"', id);
            console.error('path %s', path);
            console.error(e.message);
            console.error(e.stack);
        }

        if(instance){
            this.register(instance, id);
        }
    }

    resolve(id){
        //This method could return a Promise and a proxy,
        //were we use the proxy to handle calls for instance
        //while its being loaded...
        var instance = this[id];
        return Promise.resolve(instance);
    }
    run(){

        this.debug('Emit "run.pre"');
        this.emit('run.pre');

        this.debug('Emit "run"');
        this.emit('run');

        this.debug('Emit "run.post"');
        this.emit('run.post');
    }

    //TODO: rename as command or registerCommand
    handle(event, handler){
        console.log('- handle', event, handler);
        handler = handler.bind(this);
        this.on(event, handler);
    }

    close(code, label){
        return Promise.resolve();
    }

    static loadConfig(options = {}){
        if(!options.basepath) options.basepath = getPathToMain();

        var defaults = require('simple-config-loader')({
            basepath: __dirname
        });
        // return defaults;

        var config = require('simple-config-loader')(options);
        // config = extend(config, defaults);

        return config;
    }
}

function getPathToMain(){
    var sep = require('path').sep;
    var main = process.argv[1];
    main = main.split(sep);
    main.pop();
    main = main.join(sep);
    return main;
}

function getModuleName(file){
    return path.basename(file).replace(path.extname(file), '');
}

/**
 * Exports module
 */
module.exports = Application;
