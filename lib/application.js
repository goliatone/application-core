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
    _logger: console,
    autorun: true,
    autoinitialize: true,
    name: 'Application',
    sanitizeName: sanitizeName,
    registerReadyEvent: 'registered',
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
         * We want our listeners to be the first
         * ones added
         */
        this._registerListeners();

        /*
         * This is not the most elegant solution
         * but
         */
        if(this.config.app) extend(this, this.config.app);

        this.config = Keypath.wrap(this.config, null, 'data');

        ///*
        this.loader = new PluginLoader({
            context: this,
            basepath: __dirname,
            mountHandler: function _mount(bean, context){
                context.register(bean.plugin, bean.id);
                return bean.plugin;
            },
            afterMount: function(context){
                //this actually get's called twice :)
                //TODO: Fix
                context.emit('coreplugins.ready');
                context.logger.log('Core modules loaded!');
            }
        });

        this.register(extend, 'extend');

        this.loader.mountList(this.coremodules)
            .then(()=>{
                if(!this.loaders) return;

                if(this.loaders.modules){
                    let modulepath = this.loaders.modules;
                    if(!path.isAbsolute(modulepath)) modulepath = path.resolve(modulepath);
                    this.loader.mountDirectory(modulepath);
                }

                if(this.loaders.handlers){
                    let modulepath = this.loaders.handlers;
                    if(!path.isAbsolute(modulepath)) modulepath = path.resolve(modulepath);
                    this.loadHandlers(modulepath);
                }
            }).catch(this.onErrorHandler.bind(this, true, 'Error loading plugin.'));
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
            this._logger.warn('register: we are going to override plugin %s', name);
        }

        function _register(context, name, instance){
            context[name] = instance;
            context.emit(name + '.' + context.registerReadyEvent, out);
        }

        if(typeof out === Promise){
            out.then((instance)=> {
                _register(this, name, instance);
            }).catch(this.onErrorHandler.bind(this, true, 'register: Error registering module' + name));
        } else _register(this, name, out);
    }

    onceRegistered(id, handler){
        this.once(id + '.' + this.registerReadyEvent, handler.bind(this));
        return this;
    }

    onErrorHandler(message, critical, err){
        this._logger.error('%s', message);
        this._logger.error(err.message);
        this._logger.error(err.stack);

        if(critical && this.exitOnError){
            process.exit(1);
        }
    }

    //TODO: We need to make this async
    //so we can refactor it and use loader.
    loadDirectory(dir, options={}){
        if(!path.isAbsolute(dir)){
            dir = path.join(getPathToMain(), dir);
        }

        this._logger.info('load directory %s', dir);

        var files = glob.sync(dir, options);

        if(options.handler){
            return options.handler(files);
        }

        return Promise.resolve(files);
    }

    loadHandlers(dir='handlers', options={}){
        // this.loader.mountDirectory(dir, {mountHandler: function(bean, context, config={}){
        //         context.handle(bean.id, bean.plugin);
        //         return bean.plugin;
        //     }
        // });

        this.loadDirectory(dir).then((files)=>{
            files.map((file) => {
                this.command(getModuleName(file), require(file));
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

    _registerListeners(){
        this.once('run.pre', ()=>{
            let listeners = this.listeners('run.pre').length - 1;
            this._logger.debug('Running "pre" stage of "run" hook: %s listeners.', listeners);
        });

        this.once('run', ()=>{
            let listeners = this.listeners('run').length - 1;
            this._logger.debug('Running "run" hook: %s listeners.', listeners);
        });

        this.once('run.post', ()=>{
            let listeners = this.listeners('run.post').length - 1;
            this._logger.debug('Running "post" stage of "run" hook: %s listeners.', listeners);
        });
    }

    run(){
        if(!this.hook) {
            this.once('coreplugins.ready', this.run);
            return;
        }

        if(this.didRun) return;
        this.didRun = true;

        this.hook('run', {name: this.name}).then(()=>{
            this._logger.debug('Hook "run" complete.');
        });
    }

    //TODO: rename as command or registerCommand
    handle(event, handler){
        this._logger.warn('core::handle will be deprecated. Register command %s', event);
        this.command(event, handler);
    }

    command(event, handler){
        this._logger.debug('- register handler for %s', event);
        handler = handler.bind(this);

        this.on(event, handler);
    }

    close(code, label){
        //here we could run a close routing. Whatever it is, it should not
        //take more than 10 seconds- Serene's default
        return Promise.resolve();
    }

    get nicename(){
        return sanitizeName(this._name);
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
