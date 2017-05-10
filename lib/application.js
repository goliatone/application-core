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

/**
 * Default values for the options object
 * used to initialize an Application instance.
 *
 * It's not meant to be used directly.
 *
 * @TODO Create default banner :)
 *
 * @mixin
 * @private
 * @type Object
 */
const DEFAULTS = {

    /**
     * Default environment variable.
     * @TODO Should we set to production?
     *
     * @default development
     * @type {String}
     */
    environment: 'development',

    /**
     * This will hold the **app** child
     * logger used by the applciation
     * instance.
     * @type {[type]}
     */
    logger: console,

    /**
     * This will hold the **core** child
     * logger used by the framework to report
     * on internal events.
     *
     * @type {void}
     */
    _logger: console,

    /**
     * Flag indicating wether to start
     * the application as soon as all
     * core modules are loaded.
     *
     * @default false
     * @type {Boolean}
     */
    autorun: false,
    /**
     * Initialize the applciation from
     * the constructor call?
     *
     * You can create an application
     * instance and delay the boot cycle
     * by initializeing the instance with
     * this value set to `false`.
     *
     * @default true
     * @type {Boolean}
     */
    autoinitialize: true,

    /**
     * Name of the application instance.
     * Used by the REPL module to display the
     * prompt or by the logger module to create
     * a child logger asigned to the application
     * context.
     *
     * @default
     * @type {String}
     */
    name: 'Application',

    /**
     * Critical errors handled by `onErrorHandler`
     * will `process.exit` the application.
     *
     * @default true
     * @type {Boolean}
     */
    exitOnError: true,
    /**
     * Enable long stack traces using
     * the longjohn module.
     *
     * This module collects a lot of
     * data and it's not resource friendly.
     * It's always disabled in production
     * irregardless of this property value.
     *
     * @default true
     * @type {Boolean}
     */
    enableLongStackTrackes: true,

    /**
     * Function to sanitize module
     * names.
     *
     * It ensures the resulting
     * name is a valid JavaScript variable
     * name.
     *
     *  @example <caption>Normalized module name.</caption>
     * // returns 'dataManager'
     * context.sanitizeName('data-manager');
     *
     * @type {Function}
     */
    sanitizeName: sanitizeName,

    /**
     * Once a module is registered the
     * application instance will emit an event.
     * The event type is:
     * <moduleName>.<registerReadyEvent>
     *
     * @default registered
     * @type {String}
     */
    registerReadyEvent: 'registered',

    /**
     * List of modules that will be loaded on
     * boot and are considered to be part of
     * the application context's core.
     *
     * If you want to override this provide full
     * paths.
     *
     * @TODO: monitoring should be enabled only
     * for data processing apps.
     * @type {Array}
     */
    coremodules: [
        './logger',
        './errors',
        './dispatcher',
        './monitoring',
        './repl'
    ],

    /**
     * Base path used to resolve relative
     * paths like the paths to the modules
     * directory or other directories that
     * need to be loaded by the application
     * instance.
     *
     * Defualts to current working directory
     * of the Node.js process.
     *
     * @default
     * @type {String}
     */
    basepath: process.cwd(),

    config: {}
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
     * @constructor
     * @extends EventEmitter
     * @mixes DEFAUTLS
     * @param  {Object}    options
     */
    constructor(options) {
        options = extend({}, DEFAULTS, options);

        super();

        if(options.autoinitialize) this.init(options);
    }

    /**
     * Initializes the instance by:
     * - Registering event listeners
     * - Configuring the application instance
     * - Setup long statck traces
     * - Show ASCII banner
     * - Mount modules
     *
     * It will extend `options` with
     * `Application.DEFAULTS`, the resulting
     * object will extend the application
     * instance.
     *
     *
     * @param  {Object} options Config object
     * @return {void}
     */
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
         this._setupLongStackTraces();
         this._showBanner();
         this._mount();
     }

    /**
     * Shows a banner on cli.
     * A banner is just text outputed to
     * the console, which supports ASCII
     * formatting.
     *
     * If there is a banner property in
     * `./config/app.js` it will be handled
     * here.
     *
     * A banner can be either a string or
     * a function.
     *
     * It will not be shown in production.
     *
     * @method _showBanner
     * @private
     *
     * @return {void}
     */
    _showBanner() {

        if(this.environment === 'production') {
            return false;
        }

        if(!this.banner) return;

        /*
         * Too early to use the logger module.
         */
        if(typeof this.banner === 'string') {
            console.log(this.banner);
        }

        if(typeof this.banner === 'function') {
            this.banner(this, this.config);
        }
    }

    /**
     * This step will extend the application
     * instance with contents from `./config/app.js`.
     *
     * It creates a Keypath wrapped object
     * of the configuration object, and exposes it
     * under `config`.
     *
     * @method _configure
     * @private
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

    /**
     * Enables long stack traces with
     * `longjohn`, helpful for debuging.
     * Disabled in production.
     *
     * @method _setupLongStackTraces
     * @private
     * @return {void}
     */
    _setupLongStackTraces() {


        /*
         * Below will only be used in non
         * production environments.
         *
         * @TODO Expose configuration option?
         */
        if(this.environment === 'production') {
            return false;
        }

        /*
         * Enable long stack traces
         */
        if(this.enableLongStackTrackes) {
            require('longjohn');
        }
    }

    /**
     * Load core modules.
     *
     * @TODO Enable basepath to be configured so
     * we can load core modules from elsewhere.
     * @TODO Should basepath be an array?
     *
     * @emits Application#coreplugins.ready
     * @emits Application#logger.registered
     * @throws Will throw if an error ocurs while loading
     *         a module.
     * @method _mount
     * @private
     * @return {void}
     */
    _mount() {

        this.loader = new PluginLoader({
            context: this,
            basepath: __dirname,
            sortFilter: PluginLoader.sortByDependencies,
            mountHandler: (bean, context) => {
                context._logger.info('Mount Handler: module "%s" mounted...', bean.id);
                context.register(bean.plugin, bean.id);
                return bean.plugin;
            },
            afterMount: function(context) {
                context.emit('coreplugins.ready');
                context._logger.info('Core modules loaded...');
            }
        });

        /*
         * We can't use this.resolve with logger, since
         * we have a default logger, it means that it will
         * resolve to that value.
         */
        this.once('logger' + '.' + this.registerReadyEvent, () => {
            this.loader.logger = this.getLogger('modules');
        });

        this.loader
            .mountList(this.coremodules)
            .then(() => {
                return this.loadCommands(this.commandspath);
            }).then(() => {
                return this.loadModules(this.modulespath);
            }).catch(this.onErrorHandler.bind(this, true, 'Error loading plugin.'));
    }

    /**
     * Register a module with the application
     * context to be exposed as a property with
     * the name `name`.
     *
     * Due to the mount process and auto-wiring,
     * `name` will often times refer to a npm
     * package name or a file name. Basically
     * anyting that can be `require`d.
     *
     * This function will:
     * - Normalize `name`: ensure name is a valid
     *   JavaScript property name.
     *
     * - If the module exports an `alias` property
     *   it's normalized value will be used instead
     *   of `name`.
     *
     * - The function looks for a key in `context.config`
     *   with a key matching `name`.
     *
     * - If the config object does not export an
     *  `moduleid` property it will create it assigning `name`
     *   to it.
     *
     * - If the module exports an `init` function
     *   it will be called with a reference to the
     *   application context and a configuration object.
     *
     * - `instance` is the value of calling `require` on
     *   the module.
     *
     * - I will `Promise.resolve` `instance`, meaning that
     *   instance can be either a Promise or an object.
     *
     * - Once `instance` is resolved, the function will
     *   assign a child logger to it.
     * - If it does not have an `moduleid` property it
     *   will assing `name`.
     * - If instance extends EventEmitter it will register
     *   `handleModuleError` as an **error** listener.
     *
     * - Emit an event with the instance as event. The
     *   event type will be: <name>.<context.registerReadyEvent>.
     *   e.g. "logger.registered"
     *
     *
     * @method register
     * @emits Application#
     * @throws Will throw an Error if the module has
     * an init property that is not a function.
     * @param  {Object} instance
     * @param  {String} name     Module name
     * @return {void}
     */
    register(instance, name) {

        name = this.sanitizeName(name);

        var out = instance;

        if(instance.alias) {
            name = this.sanitizeName(instance.alias);
        }

        if(typeof instance.init === 'function') {
            var config = this.config.get(name, {});

            //TODO: we should ensure we have minimal information in config.
            if(!config.moduleid) config.moduleid = name;

            /*
             * If we are loading logger, then we dont
             * have access to logger.getLogger.
             * TODO: Figure out a way to clean this up.
             * Either provide a stop gap in the tmp logger
             * to catch this call or have a speed track for
             * logger.
             */
            if(!config.logger &&  this.logger.getLogger) {
                config.logger = this.logger.getLogger(name);
            }

            out = instance.init(this, config);

            if(!out) out = instance;

        } else {
            //TODO: Create CoreError
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
         * @TODO Move to inclass private method.
         */
        function _register(context, name, instance) {
            if(instance !== false) context._registerInstance(name, instance);
            //FIX: This might be too late, we want to make it available
            //during the initialization phase of the module.
            //We can pass it in the config.
            if(context.getLogger) {
                instance.logger = context.getLogger(name);
            }
            if(!instance.moduleid) instance.moduleid = name;

            //TODO: Figure out a better way to manage errors.
            if(typeof instance.on === 'function') {
                instance.on('error', context.handleModuleError.bind(context, name));
            }

            /*
             * @TODO: We might want to load module commands
             * @TODO: Normalize the event sent here!
             */
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
     *
     * @param  {String} attr      Attribute name
     *
     * @param  {Mixed} extension Funtion or value
     *
     * @throws This will throw a TypeError if we
     *         are trying to overwrite a previously
     *         defined property.
     *
     * @return {this}
     */
    provide(attr, extension) {

        if(this[attr]) {
            this.logger.warn('Your application context already has an attribute "%s"', attr);
            this.logger.warn('You are about to overwrite it.');
        }

        Object.defineProperty(this, attr, {
            value: extension,
            writable: false,
            configurable: true
        });

        return this;
    }

    //TODO: Normalize how/where we store modules.
    //      Should we make Application a proxy?
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
     * We can't guarantee the other in which modules
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

        //TODO: Should this be called on next tick?
        if(this._modules[id]) handler.call(this);
        else this.once(id + '.' + this.registerReadyEvent, handler.bind(this));

        //@TODO: Remove!!
        // this.once(id + '.' + this.registerReadyEvent, handler.bind(this));

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

    /**
     * Handled errors from registered modules.
     *
     * During the registration process of a module
     * we add `handleModuleError` as an event listener.
     *
     * This will retrhow the error, unless the error
     * object has a `handledByModule` property set
     * to `true`.
     *
     * We give the modules the chance to
     * prevent main app to handle this event.
     * For this to work, and since EventEmitter
     * has no event bubbling we rely on clumsy JS
     * facts:
     * - Event object is passed by reference.
     * - event handlers are executed in order they
     * where attached.
     *
     * So, if we want our module to handle an error
     * before we do here, our module needs to attach
     * it's error listener before returning the module
     * to App core.
     * @method handleModuleError
     * @throws Will retrhow the error from here.
     * @param  {String} moduleId Module name
     * @param  {Error} err      Error object
     * @return {void}
     */
    handleModuleError(moduleId, err) {
        this._logger.error('There was an error in the "%s" module.', moduleId);
        this._logger.error('The error message:', err.message);

        /*

         */
        if(err.handledByModule) {
            return false;
        }

        /*
         * @TODO: Use CoreError
         */
        throw new Error(err);
    }

//////////////////////////////////////////
//  LOADER FUNCTIONS
//////////////////////////////////////////
    loadDirectory(dir, options={}) {

        /*
         * @TODO Ensure we don't have a better way
         *       of doing this...
         */
        if(!path.isAbsolute(dir)) {
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
                context._logger.debug('Modules loaded...');
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
                context._logger.debug('Commands loaded...');
            }
        }).catch((err) => {
            this.onErrorHandler(true, 'Error loading commands.', err);
            return err;
        });
    }

    resolve(id) {

        if(Array.isArray(id)) {
            return Promise.all(id.map((i) => this.resolve(i)));
        }

        var instance = this[id];

        //TODO: Test...
        // if(instance === undefined) {
        //     return Promise.reject(id);
        // }

        if(instance) {
            return Promise.resolve(this[id]);
        }

        return new Promise((resolve, reject) => {
            this.once(id + '.' + this.registerReadyEvent, (instance) => {
                resolve(this[id]);
            });
        });
    }

    /**
     * Register event listeners to follow
     * the `run` hook.
     *
     * @method _registerListeners
     * @private
     * @return {void}
     */
    _registerListeners() {
        this.once('run.pre', ()=>{
            let listeners = getListenerCount(this, 'run.pre');
            this._logger.debug('Running "pre" stage of "run" hook: %s listeners.', listeners);
        });

        this.once('run', ()=> {
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

        if(!this.autorun) return;

        this.once('coreplugins.ready', this.run);

        // this.once('run.complete', () => {
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

    /**
     * Register a command for the given event
     * type.
     *
     * Command handler functions get bound to
     * the application context.
     *
     * @param  {String} event   Event type
     * @param  {Function} handler Command handler
     * @return {this}
     */
    command(event, handler) {
        this._logger.debug('- register handler for %s', event);
        handler = handler.bind(this);

        this.on(event, handler);

        return this;
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
