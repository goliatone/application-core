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
                var plugin = bean.plugin;
                var config = context.config.get(bean.id, {});
                var instance = plugin.init(context, config);
                context.register(instance, bean.id);
                return plugin;
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
                    // if(typeof this.loaders.handlers === 'string') this.loaders.handlers = [this.loaders.handlers];
                    this.loadHandlers(this.loaders.handlers);
                }
            }).catch((err)=>{
                console.log('ERROR', err.message);
                console.log('ERROR', err.stack);
            });
    }

    register(instance, name){
        name = this.sanitizeName(name);
        this[name] = instance;
    }

    loadDirectory(dir, options){
        if(!path.isAbsolute(dir)){
            dir = path.join(getPathToMain(), dir);
        }

        this.logger.info('load directory %s', dir);

        var files = glob.sync(dir, options);
        var promises = files.map((file) => {
            return this.loadModule(getModuleName(file), file);
        });
        return Promise.all(promises);
    }

    loadHandlers(dir='handlers', options={}){
        if(!path.isAbsolute(dir)){
            dir = path.join(getPathToMain(), dir);
        }
        var pattern = dir;

        this.logger.info('- load handlers %s', dir);

        var files = glob.sync(pattern, options);
        var that = this;

        files.map((file) => {
            this.handle(getModuleName(file), require(file));
        });
    }

    loadModule(id, path){
        this.logger.info('- loading module "%s", %s', id, path);

        var instance,
            output = Promise.defer();

        try {
            //TODO: Define a module interface. Move this to a function that
            //we can override. Right now a module has to have a "init" function.
            instance = require(path).init(this, this.config.get(id, {}));
            output.resolve(instance);
        } catch (e) {
            this.logger.error('ERROR loading module "%s"', id);
            this.logger.error('path %s', path);
            this.logger.error(e.message);
            this.logger.error(e.stack);
            output.reject(e);
        }

        if(instance){
            this.register(instance, id);
        }

        return output.promise;
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
