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
const pkg = require('../package.json');

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
        this._configure();
        this._mount();
    }

    _configure(){
        /*
         * This is not the most elegant solution
         * but
         */
        if(this.config.app) extend(this, this.config.app);

        this.config = Keypath.wrap(this.config, null, 'data');
    }

    _mount(){

        this.loader = new PluginLoader({
            context: this,
            basepath: __dirname,
            mountHandler: function _mount(bean, context){
                context.register(bean.plugin, bean.id);
                return bean.plugin;
            },
            afterMount: function(context){
                context.emit('coreplugins.ready');
                context.getLogger('modules').debug('Core modules loaded...');
            }
        });

        this.resolve('logger').then(()=>{
            this.loader.logger = this.getLogger('plugin-loader');
        });

        this.register(extend, 'extend');

        this.loader.mountList(this.coremodules)
            .then(()=>{
                if(!this.loaders) return;

                if(this.modulespath){
                    this.loadModules(this.modulespath);
                }

                if(this.commandspath){
                    this.loadCommands(this.commandspath);
                }
            }).catch(this.onErrorHandler.bind(this, true, 'Error loading plugin.'));
    }

    register(instance, name){
        name = this.sanitizeName(name);
        var out = instance;

        if(instance.alias){
            name = instance.alias;
        }

        if(instance.init){
            var config = this.config.get(name, {});
            out = instance.init(this, config);
            if(!out) out = instance;
        }

        if(this.hasOwnProperty(name)){
            this._logger.warn('register: we are going to override plugin %s', name);
        }

        function _register(context, name, instance){
            if(instance !== false) context[name] = instance;
            if(context.getLogger) instance.logger = context.getLogger(name);
            if(!instance.moduleid) instance.moduleid = name;
            context.emit(name + '.' + context.registerReadyEvent, out);
        }

        Promise.resolve(out).then((module)=>{
            _register(this, name, module);
        }).catch(this.onErrorHandler.bind(this, true, 'register: Error registering module' + name));
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

    loadModules(dir='modules', options={}){
        this.loader.mountDirectory(this.modulespath, {
            afterMount: (context)=>{
                this.emit('modules.ready');
                context.getLogger('modules').debug('Modules loaded...');
            }
        });
    }

    loadCommands(dir='commands', options={}){
        this.loader.mountDirectory(dir, {
            mountHandler: (bean, context, config={})=>{
                context.command(bean.id, bean.plugin);
                return bean.plugin;
            },
            afterMount: (context)=>{
                this.emit('commands.ready');
                context.getLogger('commands').debug('Commands loaded...');
            }
        });
    }

    resolve(id){

        if(Array.isArray(id)){
            return Promise.all(id.map((i)=>this.resolve(i)));
        }

        var instance = this[id];
        if(instance){
            return Promise.resolve(this[id]);
        }

        return new Promise((resolve, reject)=>{
            this.once(id + '.' + this.registerReadyEvent, (instance)=>{
                resolve(this[id]);
            });
        });
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

        this.once('logger' + '.' + this.registerReadyEvent, ()=>{
            this.logger.info('Application Version: ' + pkg.version);
            this.logger.info('Application Environment: ' + process.env.NODE_ENV);
        });

        // this.once('run.complete', ()=>{
        //     this.logger.profile('hook:run');
        // });
    }

    run(){
        /*
         * `hook` is a plugin, so we need to wait for
         * it to be registered before we can call it :)
         */
        if(!this.hook) {
            this.once('coreplugins' + '.' + this.registerReadyEvent, this.run);
            return;
        }

        if(this.didRun) return;
        this.didRun = true;

        // this.logger.profile('hook:run');
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

    get modulespath(){
        if(this._modulespath) return this._modulespath;
        let modulepath = this.loaders.modules;
        if(!path.isAbsolute(modulepath)) modulepath = path.resolve(modulepath);
        return this._modulespath = modulepath;
    }

    get commandspath(){
        if(this._commandspath) return this._commandspath;
        let modulepath = this.loaders.commands;
        if(!path.isAbsolute(modulepath)) modulepath = path.resolve(modulepath);
        return this._commandspath = modulepath;
    }

    /**
     * Convenience method to load configuration
     * objects.
     * @type {Object}
     */
    static loadConfig(options={}, asObject=true){
        if(!options.basepath) options.basepath = getPathToMain();
        if(!options.projectpath) options.projectpath = process.cwd();
        /*
         * First we can to load options we might have
         * here, at the core library.
         */
        let libDefaults = require('simple-config-loader')({
            basepath: __dirname
        });

        options = extend({}, DEFAULTS, libDefaults.data, options);

        let projectpath = options.projectpath;
        delete options.projectpath;

        /*
         * Now, load configurations found on the project's
         * directory.
         */
        var config = require('simple-config-loader')({
            config: options,
            basepath: projectpath,
            packagePath: projectpath + '/package'
        });

        if(asObject) return config._target;
        return config;
    }
}

Application.DEFAULTS = DEFAULTS;

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
