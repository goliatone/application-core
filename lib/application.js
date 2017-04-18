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
const pkg = require('../package.json');

const sanitizeName = require('./utils').sanitizeName;
const getPathToMain = require('./utils').getPathToMain;
const getModuleName = require('./utils').getModuleName;
const getListenerCount = require('./utils').getListenerCount;

const DEFAULTS = {
    logger: console,
    _logger: console,
    autorun: true,
    autoinitialize: true,

    name: 'Application',

    exitOnError: true,
    /*
     * Enable long stack traces using
     * the longjohn module.
     *
     * This module collects a lot of
     * data and it's not resource friendly.
     * It's always disabled in production
     * irregardless of this property value.
     *
     */
    enableLongStackTrackes: true,

    sanitizeName: sanitizeName,

    /*
     * Once a module is registered the
     * application instance will emit an event.
     * The event type is:
     * <moduleName>.<registerReadyEvent>
     */
    registerReadyEvent: 'registered',

    //TODO: monitoring should be enabled only for data processing apps.
    coremodules: ['./logger', './errors', './dispatcher', './monitoring', './repl'],

    basepath: process.cwd()
};

class Application extends EventEmitter {

    /**
     * Application constructor.
     *
     * Options is an object that should contain
     * a `config` object holding the configuration
     * that will be used to configure all modules.
     *
     * The application instance will extend itself
     * with the `options` object, meaning that we
     * can override any functions available in the
     * Application prototype or add new functions
     * which will be available in the instance.
     *
     * @method constructor
     * @param  {Object}    options
     */
    constructor(options) {
        options = extend({}, DEFAULTS, options);

        super();

        if(options.autoinitialize) this.init(options);
    }

    init(options) {
        if(this.initialized) return;
        this.initialized = true;

        options = extend({}, DEFAULTS, options);
        extend(this, options);

        this._modules = {};
        this._commands = [];

        /*
         * We want our listeners to be the first
         * ones added
         */
         this._registerListeners();
         this._configure();
         this._setupErrorHandlers();
         this._showBanner();
         this._mount();
     }

    /**
     * Shows a banner on cli.
     *
     * If there is a banner property in
     * `./config/app.js` it will be handled
     * here.
     *
     * A banner can be either a string or
     * a function.
     *
     * It will not be shown in producitn.
     *
     * @method _showBanner
     * @private
     *
     * @return {void}
     */
    _showBanner() {

        if(this.environment === 'production') return;

        if(!this.banner) return;

        /*
         * Too early to use the logger module.
         */
        if(typeof this.banner === 'string') {
            console.log(this.banner);
        }

        if(typeof this.banner === 'function') {
            this.banner(this);
        }
    }

    /**
     * This step will extend the application
     * instance with contents from `./config/app.js`
     * It will also create a Keypath wrapped object
     * of the configuration object, and expose it
     * under `config`.
     *
     * @method _configure
     * @return {void}
     */
    _configure() {
        /*
         * This is not the most elegant solution
         * but... ¯\_(ツ)_/
         */
        if(this.config.app) extend(this, this.config.app);

        this.config = Keypath.wrap(this.config, null, 'data');
    }

    _setupErrorHandlers() {


        /*
         * Below will only be used in non
         * production environments.
         */
        if(this.environment === 'production') return;

        /*
         * Enable long stack traces
         */
        if(this.enableLongStackTrackes) {
            require('longjohn');
        }
    }

    _mount() {

        this.loader = new PluginLoader({
            context: this,
            basepath: __dirname,
            sortFilter: PluginLoader.sortByDependencies,
            mountHandler: (bean, context) => {
                context._logger.info('MOUNT HANDLER: module "%s" mounted...', bean.id);
                context.register(bean.plugin, bean.id);
                return bean.plugin;
            },
            afterMount: function(context){
                context.emit('coreplugins.ready');
                context.getLogger('modules').debug('Core modules loaded...');
            }
        });

        /*
         * We can't use this.resolve with logger, since
         * we have a default logger, it means that it will
         * resolve automatically.
         */
        this.once('logger' + '.' + this.registerReadyEvent, () => {
            this.loader.logger = this.getLogger('modules');
        });

        //this.register(extend, 'extend');

        this.loader
            .mountList(this.coremodules)
            .then(() => {
                // this.loader.sortFilter = require('in').sortByDependencies;
                return this.loadCommands(this.commandspath);
            }).then(() => {
                return this.loadModules(this.modulespath);
            }).catch(this.onErrorHandler.bind(this, true, 'Error loading plugin.'));
    }

    /**
     * Register a module with the applciation context.
     *
     *
     * @method register
     * @param  {Object} instance
     * @param  {String} name     Module name
     * @return {void}
     */
    register(instance, name) {

        name = this.sanitizeName(name);

        var out = instance;

        if(instance.alias) {
            name = instance.alias;
        }

        if(typeof instance.init === 'function') {
            var config = this.config.get(name, {});

            //TODO: we should ensure we have minimal information in config.
            if(!config.moduleid) config.moduleid = name;

            out = instance.init(this, config);

            if(!out) out = instance;

        } else {
            //TODO: What should we do here? go down?! yes..
            let message = 'register: we found an init property @ ' + name + ' but its not a function';
                this.onErrorHandler(true, message, new Error('Error loading plugin: ' + name));
        }

        if(instance.commands) {
            this._logger.warn('IMPLEMENT HANDLER FOR plugin.commands!');
            //our plugin exposes a bunch of comand paths
            if(typeof instance.commands === 'string') instance.commands = [instance.commands];
            // if(typeof instance.commands === 'function') instance.commands = instance.commands();
            this._commands.push(instance.commands);
        }

        if(instance.models) {
            this._logger.warn('IMPLEMENT HANDLER FOR plugin.models!');
        }

        if(this.hasOwnProperty(name)) {
            this._logger.warn('register: we are going to override plugin %s', name);
        }

        /*
         * This is the process to register our modules.
         */
        function _register(context, name, instance) {
            if(instance !== false) context._registerInstance(name, instance);
            if(context.getLogger) instance.logger = context.getLogger(name);
            if(!instance.moduleid) instance.moduleid = name;

            //TODO: Figure out a better way to manage errors.
            if(typeof instance.on === 'function') {
                instance.on('error', context.handleModuleError.bind(context, name));
            }

            //WE MIGHT WANT TO LOAD MODULE COMMANDS.
            context.emit(name + '.' + context.registerReadyEvent, out);
        }

        //TODO: setTimeout to ensure we are not waiting for ever...
        //require('p-timeout')(delayedPromise, 50).then(() => 'foo');
        Promise.resolve(out).then((module) => {
            _register(this, name, module);
        }).catch(this.onErrorHandler.bind(this, true, 'register: Error registering module ' + name));
    }

    /**
     * This will add `attr` to the application
     * context and ensure that it does not get
     * overwritten unnoticeably.
     * If we really want to overwrite the given
     * attribute, we can still do so, but explicitly
     * using Object.defineProperty
     *
     * This will throw an error in strict mode,
     * which is probably what you want.
     *
     * @method provide
     * @param  {String} attr      Attribute name
     * @param  {Mixed} extension Funtion or value
     * @return {this}
     */
    provide(attr, extension) {
        Object.defineProperty(this, attr, {
            value: extension,
            writable: false,
            configurable: true
        });

        return this;
    }


    _registerInstance(name, instance) {
        this.provide(name, instance);
        this._modules[name] = instance;
    }

    /**
     * Register a callback to get notfied
     * once module <id> has been registered.
     *
     * Once a module is registered the
     * application instance will fire an
     * event with type `<moduleId>.registered`,
     * `logger.registred` for the logger module.
     *
     * We can't guaranty the other in which modules
     * are going to be loaded since it depends on
     * dependency chain resolution. It might be the
     * case that a module A depends on module B,
     * module A loads after module B. Using
     * `onceRegistered` module A would still get
     * notified.
     *
     *
     * @method onceRegistered
     * @param  {String}       id      Module id
     * @param  {Function}     handler Callback function
     * @return {this}
     */
    onceRegistered(id, handler) {
        id = this.sanitizeName(id);
        if(this._modules[id]) handler.call(this);
        else this.once(id + '.' + this.registerReadyEvent, handler.bind(this));
        this.once(id + '.' + this.registerReadyEvent, handler.bind(this));
        return this;
    }
//////////////////////////////////////////
//  ERROR HANDLERS
//////////////////////////////////////////
    /**
     * Application wide error handler.
     *
     * @method onErrorHandler
     * @param  {Boolean}       critical Should this error
     *                                  make the app quit.
     * @param  {String}       message  Error message outputed
     *                                 to screen.
     * @param  {Object}       err      Error object
     * @return {void}
     */
    onErrorHandler(critical, message, err) {

        this._logger.error('%s', message);
        this._logger.error(err.message);
        this._logger.error(err.stack);

        if(critical && this.exitOnError) {
            process.exit(1);
        }
    }

    handleModuleError(module, err) {
        this._logger.error('There was an error in the "%s" module.', module);
        this._logger.error('The error message:', err.message);

        /*
         * We give the modules the change to
         * prevent main app to handle this event.
         * For this to work, and since EventEmitter
         * has no event bubbling we rely on clumsy JS
         * facts:
         * - Event object is passed by reference.
         * - event handler are executed in order they
         * where attached.
         *
         * So, if we want our module to handle an error
         * before we do here, our module needs to attach
         * it's error listener before returning the module
         * to App core.
         */
        if(err.handledByModule) return;

        throw new Error(err);
    }

//////////////////////////////////////////
//  LOADER FUNCTIONS
//////////////////////////////////////////
    loadDirectory(dir, options={}) {
        if(!path.isAbsolute(dir)){
            dir = path.join(getPathToMain(), dir);
        }

        this._logger.info('load directory %s', dir);

        var files = glob.sync(dir, options);

        if(options.handler) {
            return options.handler(files);
        }

        return Promise.resolve(files);
    }

    loadModules(dir='modules', options={}) {
        return this.loader.mountDirectory(dir, {
            afterMount: (context)=>{
                this.emit('modules.ready');
                context.getLogger('modules').debug('Modules loaded...');
            }
        }).catch((err) => {
            this.onErrorHandler(true, 'Error loading modules.', err);
            return err;
        });
    }

    loadCommands(dir='commands', options={}) {
        return this.loader.mountDirectory(dir, {
            mountHandler: (bean, context, config={}) => {
                context.command(bean.id, bean.plugin);
                return bean.plugin;
            },
            afterMount: (context) => {
                this.emit('commands.ready');
                context.getLogger('commands').debug('Commands loaded...');
            }
        }).catch((err) => {
            this.onErrorHandler(true, 'Error loading commands.', err);
            return err;
        });
    }

    resolve(id) {

        if(Array.isArray(id)){
            return Promise.all(id.map((i) => this.resolve(i)));
        }

        var instance = this[id];
        if(instance){
            return Promise.resolve(this[id]);
        }

        return new Promise((resolve, reject)=>{
            this.once(id + '.' + this.registerReadyEvent, (instance) => {
                resolve(this[id]);
            });
        });
    }

    _registerListeners() {
        this.once('run.pre', ()=>{
            let listeners = getListenerCount(this, 'run.pre');
            this._logger.debug('Running "pre" stage of "run" hook: %s listeners.', listeners);
        });

        this.once('run', ()=>{
            let listeners = getListenerCount(this, 'run');
            this._logger.debug('Running "run" hook: %s listeners.', listeners);
        });

        this.once('run.post', ()=>{
            let listeners = getListenerCount(this, 'run.post');
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

    run() {
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
    handle(event, handler) {
        this._logger.warn('core::handle will be deprecated. Register command %s', event);
        this.command(event, handler);
    }

    command(event, handler) {
        this._logger.debug('- register handler for %s', event);
        handler = handler.bind(this);

        this.on(event, handler);
    }

    close(code, label) {
        //here we could run a close routing. Whatever it is, it should not
        //take more than 10 seconds- Serene's default
        return Promise.resolve();
    }

    get nicename() {
        return sanitizeName(this._name);
    }

    get modulespath() {
        //TODO: clean up, either do this on set or outside of
        //here...
        if(this._modulespath) return this._modulespath;
        if(!this.loaders || !this.loaders.modules) return undefined;
        let modulepath = this.loaders.modules;
        if(!path.isAbsolute(modulepath)) modulepath = path.resolve(modulepath);
        return this._modulespath = modulepath;
    }

    get commandspath() {
        //TODO: clean up, either do this on set or outside of
        //here...
        if(this._commandspath) return this._commandspath;
        if(!this.loaders || !this.loaders.commands) return undefined;
        let modulepath = this.loaders.commands;
        if(!path.isAbsolute(modulepath)) modulepath = path.resolve(modulepath);
        return this._commandspath = modulepath;
    }

    /**
     * Convenience method to load configuration
     * objects.
     *
     * @method loadConfig
     * @param  {Object}   options={}    Default options
     * @param  {Boolean}  asObject=true Return an object
     * @return {Object}
     */
    static loadConfig(options={}, asObject=true) {
        if(!options.basepath) options.basepath = getPathToMain();
        if(!options.projectpath) options.projectpath = process.cwd();

        const configLoader = require('simple-config-loader');
        /*
         * First we can to load options we might have
         * here, at the core library.
         */
        let libDefaults = configLoader({
            basepath: __dirname
        });

        options = extend({}, DEFAULTS, libDefaults.data, options);

        let projectpath = options.projectpath;
        delete options.projectpath;

        /*
         * Now, load configurations found on the project's
         * directory.
         */
        var config = configLoader({
            config: options,
            basepath: projectpath,
            packagePath: projectpath + '/package'
        });

        if(asObject) return config._target;
        return config;
    }
}

Application.DEFAULTS = DEFAULTS;

/**
 * Exports module
 */
module.exports = Application;
