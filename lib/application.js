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
const Keypath = require('gkeypath');
const EventEmitter = require('events');
const PluginLoader = require('in');
const sanitizeName = require('./utils').sanitizeName;

const DEFAULTS = {
    logger: console,
    autorun: true,
    autoinitialize: true,
    name: 'Application',
    sanitizeName: sanitizeName,
    //TODO: monitoring should be enabled only for data processing apps.
    coremodules: ['./logger', './errors', './dispatcher', './monitoring', './repl'],
    basepath: process.cwd()
};

class Application extends EventEmitter {
    constructor(options){
        options = extend({}, DEFAULTS, options);

        super();

        if(options.autoinitialize) this.init(options);
    }

    init(config) {
        if(this.initialized) return;
        this.initialized = true;

        config = extend({}, DEFAULTS, config);

        extend(this, config);

        /*
         * This is not the most elegant solution
         * but
         */
        if(this.config.app) extend(this, this.config.app);

        this.config = Keypath.wrap(this.config, null, 'data');

        ///*
        const loader = new PluginLoader({
            context: this,
            basepath: __dirname,
            mountHandler: function _mount(bean, context){
                context.register(bean.plugin, bean.id);
                return bean.plugin;
            },
            afterMount: function(context){
                context.emit('coreplugins.ready');
                context.logger.log('Core modules loaded!');
            }
        });

        this.register(extend, 'extend');

        loader.mountList(this.coremodules)
            .then(()=>{
                if(!this.loaders) return;
                if(this.loaders.modules){
                    let modulepath = path.resolve(this.loaders.modules);
                    loader.mountDirectory(modulepath);
                }

                if(this.loaders.handlers){
                    this.loadHandlers(this.loaders.handlers);
                }
            }).catch((err)=>{
                console.log('ERROR', err.message);
                console.log('ERROR', err.stack);
            });
    }

    register(instance, name){
        name = this.sanitizeName(name);
        var out = instance;

        if(instance.init){
            var config = this.config.get(name, {});
            out = instance.init(this, config);
            if(!out) out = instance;
        }

        if(this.hasOwnProperty(name)){
            this.logger.warn('we were going to override plugin %s', name);
        }
        this[name] = out;
    }

    loadDirectory(dir, options={}){
        if(!path.isAbsolute(dir)){
            dir = path.join(getPathToMain(), dir);
        }

        this.logger.info('load directory %s', dir);

        var files = glob.sync(dir, options);

        if(options.handler){
            return options.handler(files);
        }

        return Promise.resolve(files);
    }

    loadHandlers(dir='handlers', options={}){
        this.loadDirectory(dir).then((files)=>{
            files.map((file) => {
                this.handle(getModuleName(file), require(file));
            });
        });
    }

    resolve(id){
        //This method could return a Promise and a proxy,
        //were we use the proxy to handle calls for instance
        //while its being loaded...
        var instance = this[id];
        return Promise.resolve(instance);
    }

    run(){
        if(this.didRun) return;
        this.didRun = true;

        //TODO: ideally we would have a way to manage each
        //cycle of running hooks. We would register a handler
        //and each whould return a promise, we wouldn't start
        //a new lifecycle until all are done

        setTimeout(() => {
            this.logger.info('Emit "run.pre"');
            this.emit('run.pre');

            this.logger.info('Emit "run"');
            this.emit('run');

            this.logger.info('Emit "run.post"');
            this.emit('run.post');
        }, 0);
    }

    //TODO: rename as command or registerCommand
    handle(event, handler){
        /*
         * Here Were Dragons... if you uncomment this
         * log, handler gets executed (?) and takes everything
         * out of wack.
         */
        // this.logger.info('- register handler for %s', event, handler);

        this.logger.info('- register handler for %s', event);
        handler = handler.bind(this);

        this.on(event, handler);
    }

    close(code, label){
        //here we could run a close routing. Whatever it is, it should not
        //take more than 10 seconds- Serene's default
        return Promise.resolve();
    }

    set name(name = ''){
        this._name = name;
        //we have not run extend and sanitizeName is
        //not part of the prototype :)
        this._slug = sanitizeName(name);
    }
    get name(){
        return this._name;
    }

    static loadConfig(options={}, asObject=true){
        if(!options.basepath) options.basepath = getPathToMain();

        var libDefaults = require('simple-config-loader')({
            basepath: __dirname
        });

        options = extend({}, DEFAULTS, libDefaults.data, options);

        var config = require('simple-config-loader')({
            config: options,
            basepath: process.cwd()
        });

        if(asObject) return config._target;
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
