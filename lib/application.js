/*
 * Application Core
 * https://github.com/goliatone/application-core
 *
 * @copyright Copyright (c) 2016 goliatone
 * @license Licensed under the MIT license.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const glob = require('glob');
const extend = require('gextend');
const Keypath = require('gkeypath');
const EventEmitter = require('events');
const PluginLoader = require('in');
const timeoutPromise = require('p-timeout');

const pkg = require('../package.json');

const _makeExcludeFilterFromWantList = require('./utils').makeExcludeFilterFromWantList;
const sanitizeName = require('./utils').sanitizeName;
const getPathToMain = require('./utils').getPathToMain;
const getModuleName = require('./utils').getModuleName;
const getListenerCount = require('./utils').getListenerCount;
const fullStack = require('./utils').fullStack;
const _isFunction = require('./utils').isFunction;
const _getUid = require('./utils').getUid;
const _normalizeCommandObject = require('./utils').normalizeCommandObject;

const noop = require('noop-console').logger();

/**
 * Default values for the options object
 * used to initialize an Application instance.
 *
 * It's not meant to be used directly.
 *
 *
 * @TODO Create default banner :)
 *
 * @lends Application.prototype
 */
const DEFAULTS = {

    /**
     * Default environment variable.
     * This is used for instance to enable
     * long stack traces using
     * the longjohn module.
     *
     * @todo Should we set to production?
     *
     * @memberof Application
     * @instance
     * @default development
     * @type {String}
     */
    environment: 'development',

    /**
     * This will hold the **app** child
     * logger used by the applciation
     * instance. The output will be
     * identified with the **app** id.
     *
     * @memberof Application
     * @instance
     * @type {Logger}
     */
    logger: noop,

    /**
     * Default implementation of a logger
     * factory that is provided by the
     * logger module. Needed to ensure we
     * can run applications if we decide to
     * not load the logger module.
     *
     * @example
     * context.getLogger('my-module').info('hi');
     *
     * @memberof Application
     * @instance
     * @param {String} name Child logger indentifier
     * @return {Logger} A child logger instance.
     */
    getLogger: function(name) {
        return noop;
    },

    /**
     * This will hold the **core** child
     * logger used by the framework to report
     * on internal events.
     *
     * @memberof Application
     * @instance
     * @private
     * @type {void}
     */
    _logger: noop,

    /**
     * Flag indicating wether to start
     * the application as soon as all
     * core modules are loaded.
     *
     * @memberof Application
     * @instance
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
     * @memberof Application
     * @instance
     * @default true
     * @type {Boolean}
     */
    autoinitialize: true,

    /**
     * If a module has a `commands`
     *
     * @memberof Application
     * @instance
     * @type {Boolean}
     */
    autoloadModulesCommands: false,

    /**
     * Name of the application instance.
     * Used by the REPL module to display the
     * prompt or by the logger module to create
     * a child logger asigned to the application
     * context.
     *
     * @memberof Application
     * @instance
     * @default
     * @type {String}
     */
    name: 'Application',

    /**
     * Critical errors handled by `onErrorHandler`
     * will `process.exit` the application.
     *
     * @memberof Application
     * @instance
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
     * @memberof Application
     * @instance
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
     *```js 
     * // returns 'dataManager'
     * context.sanitizeName('data-manager');
     *```
     * @memberof Application
     * @instance
     * @type {Function}
     */
    sanitizeName: sanitizeName,

    /**
     * Once a module is registered the
     * application instance will emit an event.
     * The event type is:
     * <moduleName>.<registerReadyEvent>
     *
     * @memberof Application
     * @instance
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
     * @memberof Application
     * @instance
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
     * @memberof Application
     * @instance
     * @default
     * @type {String}
     */
    basepath: process.cwd(),

    /**
     * Default paths to load commands
     * and modules. Relative to application
     * path.
     *
     * @memberof Application
     * @instance
     * @type {Object}
     */
    loaders: {
        modules: './modules',
        commands: './commands'
    },

    /**
     * Time in seconds aftwer which we reject
     * a call to `context.resolve`.
     *
     * If we set it too low we might not give
     * enough time to slower parts of the application
     * to fail, for instance if the ORM module is
     * taking a long time to connect we might
     * abort the app without having the ORM
     * throw an error, thus being hard to debug.
     *
     * @memberof Application
     * @instance
     * @type {Number}
     */
    resolveTimeout: 40 * 1000,

    /**
     * Time in seconds aftwer which we reject
     * a call to `context.register`.
     *
     * @memberof Application
     * @instance
     * @type {Number}
     */
    registerTimeout: 10 * 1000,

    /**
     *
     * @memberof Application
     * @instance
     */
    config: {},

    /**
     * `registration.data` can be either
     * an object or a function that returns
     * an object.
     * The object will be sent to the
     * core.io application registry.
     * @memberof Application
     * @instance
     */
    registration: {
        url: 'http://localhost:7331',
        data: {},
    },
    defaultRegistrationData: function() {
        let payload = {};

        /*
         * We want to notify about the
         * REPL port.
         */
        if (this.config.repl) {
            payload.repl = {
                port: this.config.repl.port
            };
        }

        /*
         * If there is a serer, notify
         * it's port.
         */
        if (this.config.server) {
            payload.server = {
                port: this.config.server.port
            }
        }

        if (this.config.app.hostname) {
            payload.hostname = this.config.app.hostname;
        } else payload.hostname = os.hostname();

        return payload;
    },
    /*
     * This function will register the
     * current applciation instance with
     * the core.io application registry.
     *
     * @instance
     * @memberof Application
     */
    registry: require('./registry'),

    /**
     * Function to generate unique IDs
     * for events. Exposed to the context.
     * Accessible in the repl as `app.getUid`.
     */
    getUid: _getUid
};


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
 * @mixes DEFAULTS
 * @param  {Object}    options
 */
class Application extends EventEmitter {

    constructor(options) {
        options = extend({}, DEFAULTS, options);

        super();

        if (options.autoinitialize) this.init(options);
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
        if (this.initialized) return;
        this.initialized = true;

        options = extend({}, DEFAULTS, options);
        extend(this, options);

        this._modules = {};
        this._commands = [];
        this._registering = [];
        this._mountedPaths = new Map();
        this._commandTypes = [];

        /*
         * We want our listeners to be the first
         * ones added
         */
        this._registerListeners();
        this._configure();
        this._nameProcess();
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
     * @private
     *
     * @return {void}
     */
    _showBanner() {

        if (this.environment === 'production') {
            return false;
        }

        if (!this.banner) return;

        /*
         * Too early to use the logger module.
         */
        if (typeof this.banner === 'string') {
            console.log(this.banner);
        }

        if (_isFunction(this.banner)) {
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
     * @private
     * @return {void}
     */
    _configure() {
        /*
         * This is not the most elegant solution
         * but... ¯\_(ツ)_/¯
         */
        if (this.config.app) extend(this, this.config.app);

        this.config = Keypath.wrap(this.config, null, 'data');
    }

    /**
     * Set the process name to either the
     * application's `nicename` or to the
     * value of `config.app.processName`.
     *
     * @private
     * @return {void}
     */
    _nameProcess() {
        if (this.config.app && this.config.app.processName) {
            process.title = this.config.app.processName;
        } else {
            process.title = this.nicename;
        }
    }

    /**
     * Enables long stack traces with
     * `longjohn`, helpful for debuging.
     * Disabled in production.
     *
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
        if (this.environment === 'production') {
            return false;
        }

        /*
         * Enable long stack traces
         */
        if (this.enableLongStackTrackes) {
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
     * @throws {Error } Will throw if an error ocurs while loading
     *         a module.
     * @private
     * @return {void}
     */
    _mount() {

        this.loader = new PluginLoader({
            context: this,
            basepath: __dirname,
            sortFilter: PluginLoader.sortByDependencies,
            /*
             * Note that this callback will be
             * executed for core and local modules
             * since it's extending the PluginLoader
             * instance.
             */
            mountHandler: (bean, context) => {
                context._logger.debug('Mount Handler: module "%s" mounted...', bean.id);
                context.register(bean.plugin, bean.id);

                //TODO: we might want to check options for autoload
                //commands. Maybe we want to override provided commands
                //of a module with our own... to do so we need to be able
                //to access options from name
                if (context._moduleHasCommands(bean)) {
                    context._logger.warn('Plugin "%s" has commands', bean.id);
                    this._commands.push(bean.path);
                }

                return bean.plugin;
            },
            afterMount: function(context) {
                context.emit('coreplugins.ready');
                context._logger.debug('Core modules loaded...');
            }
        });

        this.loader
            .mountList(this.coremodules)
            .then(_ => {
                return this.loadCommands(this.commandspath);
            }).then(_ => {
                return this.loadModules(this.modulespath, this.loadModulesOptions);
            }).then(_ => {
                return this._loadModuleExposedCommands();
            })
            .catch(this.onErrorHandler.bind(this, true, 'Error loading plugin.'));
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
     * @throws {Error} Will throw an Error if the module has
     * an init property that is not a function.
     * @param  {Object} instance Module instance
     * @param  {String} name     Module name
     * @return {void} Nothing
     */
    register(instance, name) {

        name = this.sanitizeName(name);

        var out = instance;

        if (instance.alias) {
            name = this.sanitizeName(instance.alias);
        }

        if (_isFunction(instance.init)) {
            let config = this.config.get(name, {});

            //TODO: we should ensure we have minimal information in config.
            if (!config.moduleid) config.moduleid = name;

            if (!config.basepath) config.basepath = this.modulespath;

            /*
             * If we are loading logger, then we dont
             * have access to logger.getLogger.
             * TODO: Figure out a way to clean this up.
             * Either provide a stop gap in the tmp logger
             * to catch this call or have a speed track for
             * logger.
             */
            if (!config.logger && this.logger.getLogger) {
                config.logger = this.logger.getLogger(name);
            }

            try {
                out = instance.init(this, config);
            } catch (e) {
                throw e;
            }

            if (!out) out = instance;

        } else {
            //TODO: Create CoreError
            let message = 'register: we found an init property @ ' + name + ' but its not a function';
            this.onErrorHandler(true, message, new Error('Error loading plugin: ' + name));
        }

        /**
         * TODO: We want to autoload commands if available!
         */
        if (instance.commands) {
            this._logger.warn('IMPLEMENT HANDLER FOR plugin.commands!');
            //our plugin exposes a bunch of comand paths
            // if(typeof instance.commands === 'string') instance.commands = [instance.commands];
            // if(typeof instance.commands === 'function') instance.commands = instance.commands();
            // this._commands = this._commands.concat(instance.commands);
        }

        if (instance.models) {
            this._logger.warn('IMPLEMENT HANDLER FOR plugin.models!');
        }

        if (this.hasOwnProperty(name)) {
            this._logger.warn('register: we are going to override plugin %s', name);
        }

        /*
         * This is the process to register our modules.
         * @TODO Move to inclass private method.
         */
        function _register(context, name, instance) {
            if (instance !== false) context._registerInstance(name, instance);
            //FIX: This might be too late, we want to make it available
            //during the initialization phase of the module.
            //We can pass it in the config.
            if (context.getLogger) {
                instance.logger = context.getLogger(name);
            }
            if (!instance.moduleid) instance.moduleid = name;

            //TODO: Figure out a better way to manage errors.
            if (_isFunction(instance.on)) {
                instance.on('error', context.handleModuleError.bind(context, name));
            }

            context._checkRegistrationStatus(name);

            /*
             * @TODO: We might want to load module commands
             * @TODO: Normalize the event sent here!
             */
            context.emit(name + '.' + context.registerReadyEvent, instance);
        }

        /**
         * Keep a reference to the module
         * we are registering, we will use 
         * the queue to notify when all 
         * modules are resolved.
         */
        this._registering.push(name);

        timeoutPromise(Promise.resolve(out), this.registerTimeout).then(module => {
            _register(this, name, module);
        }).catch(this.onErrorHandler.bind(this, true, 'register: Error registering module ' + name));
    }

    /**
     * Check if all registered modules have been 
     * resolved.
     * 
     * @private
     * @param {String} id Module id
     * @returns {void}
     */
    _checkRegistrationStatus(id) {
        const index = this._registering.indexOf(id);

        if (index > -1) {
            this._registering.splice(index, 1);
        } else {
            this.logger.warn('Checking for status of unknown module "%s"', id);
        }

        if (!this._mountingModules) return;

        if (this._registering.length === 0) {
            this.logger.debug('Notify all modules are registered and resolved...');
            this.emit('modules.resolved');
        }
    }

    /**
     * This will add `attr` to the application
     * context and ensure that it does not get
     * overwritten unnoticeably.
     *
     * If we really want to overwrite the given
     * attribute, we can still do so, but explicitly
     * using Object.defineProperty
     *
     * This will throw an error in strict mode,
     * which is probably what you want.
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

        if (this[attr]) {
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
     * Checks wether a module with name `name`
     * has been registered.
     * @param  {String}  name Module id
     * @return {Boolean}
     */
    isModuleRegistered(name) {
        return !!this._modules[name];
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
     * @param  {String}       id      Module id
     * @param  {Function}     handler Callback function
     * @emits Application#<id>.registered
     * @return {this}
     */
    onceRegistered(id, handler) {
        id = this.sanitizeName(id);

        //TODO: Should this be called on next tick?
        if (this._modules[id]) handler.call(this);
        else this.once(id + '.' + this.registerReadyEvent, handler.bind(this));

        return this;
    }

    //////////////////////////////////////////
    //  ERROR HANDLERS
    //////////////////////////////////////////
    /**
     * Application wide error handler.
     *
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
        this._logger.error(fullStack(err));

        if (critical && this.exitOnError) {
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
     *
     * @throws {Error} Will retrhow the error from here.
     * @param  {String} moduleId Module name
     * @param  {Error} err      Error object
     * @return {void}
     */
    handleModuleError(moduleId, err) {
        this._logger.error('There was an error in the "%s" module.', moduleId);
        this._logger.error('The error message:', err.message);

        /*

         */
        if (err.handledByModule) {
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
    /**
     * Helper function to glob contents of
     * a directory. Returns a Promise that
     * resolves with the files. If the `options`
     * object contains a `handler` function
     * then we return the value of calling this
     * function.
     *
     * @param  {String} dir          Path to directory
     * @param  {Object} [options={}] Options object
     * @return {Promise}             Will resolve with files
     */
    loadDirectory(dir, options = {}) {

        /*
         * @TODO Ensure we don't have a better way
         *       of doing this...
         */
        if (!path.isAbsolute(dir)) {
            dir = path.join(getPathToMain(), dir);
        }

        this._logger.debug('load directory %s', dir);

        const files = glob.sync(dir, options);

        if (options.handler) {
            return options.handler(files);
        }

        return Promise.resolve(files);
    }

    /**
     * This function will collect and process
     * all valid module files found in a given
     * directory.
     * 
     * This will an `modules.ready` event after 
     * mounting the modules directory. Unfortunatedly
     * the event name is a bit missleading, since 
     * modules might have been mounted but are not
     * necessarily done with their setup.
     * 
     * Valid options:
     * - `options.only`: Array of modules to select.
     *
     * @param  {String} [dir='modules'] Path to dir
     * @param  {Object} [options={}]    Options object
     * @event {Event} `modules.ready`
     * @return {Promise}
     */
    loadModules(dir = 'modules', options = {}) {
        this._mountedPaths.set(dir, true);

        _makeExcludeFilterFromWantList(options);

        return this.loader.mountDirectory(dir, {
            exclude: options.patterns,
            afterMount: (context) => {
                this._mountingModules = true;
                this.emit('modules.ready');
            }
        }).catch(err => {
            this.onErrorHandler(true, 'Error loading modules.', err);
            return err;
        });
    }

    /**
     * This function will collect and process
     * all valid command files in a given directory.
     * It will register them with the application
     * context.
     * @param  {String} [dir='commands'] Path to dir
     * @param  {Object} [options={}]     Options object
     * @return {Promise}
     */
    loadCommands(dir = 'commands', options = {}) {
        this._mountedPaths.set(dir, true);

        if (!fs.existsSync(dir)) {
            this.logger.warn('directory ENOENT for loadCommands(%s)', dir);
            return Promise.resolve();
        }

        return this.loader.mountDirectory(dir, {
            mountHandler: (bean, context, config = {}) => {
                context.command(bean.id, bean.plugin);
                return bean.plugin;
            },
            afterMount: (context) => {
                this.emit('commands.ready');
                context._logger.debug('Commands from dir "%s" loaded...', dir);
            }
        }).catch(err => {
            this.onErrorHandler(true, 'Error loading commands.', err);
            return err;
        });
    }

    /**
     * Load commands for a given module
     *
     * @param  {String} modulePathOrId module path or id
     * @return {Promise}
     */
    loadModuleCommands(modulePathOrId) {
        let dir;

        if (path.isAbsolute(modulePathOrId)) {
            dir = path.join(modulePathOrId, 'commands');
        } else {
            dir = path.join(this.modulespath, modulePathOrId, 'commands');
        }

        this._logger.debug('load module commands: %s', dir);

        if (this._mountedPaths.has(dir)) {
            return Promise.resolve();
        }

        return this.loadCommands(dir);
    }

    _loadModuleExposedCommands() {

        if (!this.autoloadModulesCommands) {
            this._logger.debug('Ignoring sub comamnds, you need to set config option');
            this._logger.debug('autoloadModulesCommands in config/app.js to true');
            return Promise.resolve();
        }

        let promises = [];

        this._commands.forEach(moduleid => {
            this._logger.debug('Loading subcommand for %s', moduleid);
            promises.push(this.loadModuleCommands(moduleid));
        });

        this._commands = [];
        return Promise.all(promises);
    }

    /**
     * Resolve a dependency, this will return a Proimse
     * that will be resolved once the module(s) is available.
     *
     * If the module was already loaded the Promise will
     * be resolve immediately. If not it will wait for the
     * module to be registered.
     *
     * If after `context.resolveTimeout` milliseconds the
     * module has not been registered the promise will be
     * rejected.
     *
     * If `id` is `undefined` this method will
     * throw an Error.
     * If we are trying to resolve a set of dependencies
     * that might or might not be there you can pass
     * `ignoreUndefinedIds` as true to not generate an error.
     * This might be the case if we are loading optional
     * dependencies from a user configuration file
     *
     * @param  {String|Array} id Module id
     * @param  {Boolean} [ignoreUndefinedIds=false] Wether to ignore undefined ids.
     * @throws {Error} If `id` are undefined.
     * @throws {Error} If resolving a dep takes longer than `resolveTimeout`.
     * @return {Promise}
     */
    resolve(id, ignoreUndefinedIds = false) {

        if (!id) {
            /*
             * We are dealing with optional
             * dependecies.
             */
            if (ignoreUndefinedIds) {
                return Promise.resolve();
            }

            throw new Error('Undefined identifier for resolve');
        }

        if (Array.isArray(id)) {
            return Promise.all(id.map((i) => this.resolve(i)));
        }

        /*
         * @TODO: remove this check and use onceRegistered instead of once.
         */
        let instance = this[id];

        if (instance) {
            return Promise.resolve(instance);
        }

        return new Promise((resolve, reject) => {

            let tid = setTimeout(_ => {
                const msg = `Call to resolve("${id}") timed out after ${this.resolveTimeout / 1000}s.`;
                this.logger.error(msg);
                reject(new Error(msg));
            }, this.resolveTimeout);

            this.once(id + '.' + this.registerReadyEvent, instance => {
                clearTimeout(tid);
                resolve(this[id]);
            });
        });
    }

    /**
     * Register event listeners to follow
     * the `run` hook.
     *
     * @private
     * @return {void}
     */
    _registerListeners() {
        this.once('run.pre', () => {
            let listeners = getListenerCount(this, 'run.pre');
            this._logger.debug('Running "pre" stage of "run" hook: %s listeners.', listeners);
        });

        this.once('run', () => {
            let listeners = getListenerCount(this, 'run');
            this._logger.debug('Running "run" hook: %s listeners.', listeners);
        });

        this.once('run.post', () => {
            let listeners = getListenerCount(this, 'run.post');
            this._logger.debug('Running "post" stage of "run" hook: %s listeners.', listeners);
        });

        /*
         * We can't use this.resolve with logger, since
         * we have a default logger, it means that it will
         * resolve to that value.
         */
        this.once(`logger.${this.registerReadyEvent}`, _ => {
            this.loader.logger = this.getLogger('modules');
        });

        this.once('modules.ready', () => {
            this._logger.debug('Modules loaded...');

            this.logger.debug('Application Version: ' + pkg.version);
            this.logger.debug('Application Environment: ' + this.environment);

            let time = (process.uptime()).toFixed(3);
            this._logger.debug('Application took %ss to boot...', time, {
                __meta__: {
                    style: 'bold+white+magenta_bg'
                }
            });
        });

        if (!this.autorun) return;

        this.once('coreplugins.ready', this.run.bind(this));
    }

    /**
     * Application entry point. This will register
     * a hook listener for the `run` hook, and
     * once the hook has finalized will call
     * `registerApplication`.
     *
     * @return {void}
     */
    run() {
        /*
         * `hook` is a plugin, so we need to wait for
         * it to be registered before we can call it :)
         */
        if (!this.hook) {
            this.once(`coreplugins.ready`, this.run.bind(this));
            return;
        }

        if (this.didRun) return;
        this.didRun = true;

        // this.logger.profile('hook:run');
        this.hook('run', { name: this.name }).then(_ => {
            this._logger.debug('Hook "run" complete.');
            this.registerApplication();
        });
    }

    /**
     * Register the application instance with
     * the core.io registry service.
     *
     * @return {void}
     */
    registerApplication(register = true) {
        this._logger.debug('Register application...', this.registration);

        let options = extend({ data: {} }, this.defaultRegistrationData(), this.registration);

        if (_isFunction(options.data)) options.data = options.data.call(this);

        /*
         * Ensure we send the appId.
         */
        if (!options.data.appId) {
            options.data.appId = this.name;
        }

        if (!options.data.environment) {
            options.data.environment = this.environment;
        }

        options.register = register;
        this._logger.debug('options...', options);

        /**
         * We can register our application with a
         * service to keep track of instances.
         * There are different implementations
         * such as a local mdns or an HTTP service
         * like the core.io registry.
         */
        if (_isFunction(this.registry)) {
            return this.registry(this, options);
        }

        //This is ugly!
        return false;
    }

    /**
     * Deregister the application instance from
     * the core.io registry service.
     *
     * @return {void}
     */
    deregisterApplication() {
        return this.registerApplication(false);
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
     * We can ensure that a given `eventType`
     * executes a single command by setting
     * `unique` to true.
     * 
     * **Responses**
     * 
     * When the command returns a `Promise` then
     * we have to options to handle the response:
     * - If we pass in a function `raspondTo` in 
     * the event, it will be called once the 
     * command has completed.
     * - Else we fire an event `${eventType}.done`
     * 
     * @param  {String}   eventType       Event type
     * @param  {Function} handler        Command handler
     * @param  {Boolean}  [unique=false] Register a single command
     *                                   for a given eventType
     * @return {this}
     */
    command(eventType, handler, unique = false) {
        this._logger.debug('- register handler for %s', eventType);

        let command = _normalizeCommandObject(handler);

        handler = command.execute.bind(this);

        if (unique && this.listeners(eventType).length > 0) {
            this._logger.warn('- %s has a listener registered and marked as unique', eventType);
            return this;
        }

        this.on(eventType, (e = {}) => {
            this.logger.debug('Execute command for %s', eventType);

            e = this.makeEventForCommand(eventType, e);

            this.wrapRespondTo(e);

            const out = handler(e);

            /**
             * NOTE: Do we want to not notify if we don't 
             * return anything? Or we want to always notify
             * on completion? Review behavior.
             */
            if (!out) return;

            Promise.resolve(out).then(response => {
                if (_isFunction(e.respondTo)) {

                    if (e.__handled) return; //not sure if this works
                    e.respondTo({
                        id: e.id,
                        type: e.type,
                        response
                    });

                } else {
                    this.emit(`${eventType}.done`, {
                        id: e.id,
                        type: e.type,
                        response: out
                    });
                }
            }).catch(err => {
                this.logger.error('Error executing command "%s".', eventType);
                this.logger.error(err);
            });
        });

        this._commandTypes.push(eventType);

        return this;
    }

    /**
     * Check to see if we have a command
     * registered with the given event type.
     * @param {String} type Event type
     * @returns {Boolean}
     */
    hasCommand(type) {
        return this._commandTypes.includes(type);
    }

    /**
     * Ensure we attach the needed elements 
     * to the event passed in to the command.
     * It will add:
     * - type
     * - context
     * - id
     * 
     * @param {String} eventType Event type
     * @param {Object} e Event object
     * @private
     */
    makeEventForCommand(eventType, e = {}) {
        if (!e.type) e.type = eventType;
        if (!e.context) e.context = this;
        if (!e.id) e.id = this.getUid();
        return e;
    }

    /**
     * We want to make sure we only handle
     * responses from command once.
     * 
     * @param {Object} event Event object
     * @param {String|Function} event.respondTo 
     */
    wrapRespondTo(event) {
        if (!event.respondTo) return;
        if (!_isFunction(event.respondTo)) return;

        event.__respondTo = event.respondTo;

        event.respondTo = function $responseHandler() {
            const args = Array.from(arguments);
            event.__handled = true;
            event.__respondTo.apply(null, args);
        };
    }

    _moduleHasCommands(bean) {
        return fs.existsSync(bean.path + '/commands');
    }

    /**
     * Use this function to exit the application
     * gracefully.
     * By default with will deregsiter the application
     * from the registry.
     *
     * @param  {Number} code  Error code
     * @param  {String} label Error label
     * @return {Promise}
     */
    close(code, label) {
        //here we could run a close routing. Whatever it is, it should not
        //take more than 10 seconds- Serene's default
        this.logger.warn('');
        this.logger.warn('=================================');
        this.logger.warn('              CLOSE');
        this.logger.warn('-  code %s', code);
        this.logger.warn('-  label %s', label);
        this.logger.warn('=================================');

        /*
         * Should we emit an event here instead?
         * this.on('close', this.deregisterApplication);
         * this.emit('close');
         */
        let req = this.deregisterApplication();

        return Promise.resolve(req);
    }

    /**
     * Sanitized version of the given name.
     * It will remove starting digits, and camel
     * case it.
     *
     * @type {String}
     */
    get nicename() {
        return sanitizeName(this.name || this.config.app);
    }

    get modulespath() {
        //TODO: clean up, either do this on set or outside of
        //here...
        if (this._modulespath) return this._modulespath;
        if (!this.loaders || !this.loaders.modules) return undefined;
        let modulepath = this.loaders.modules;
        if (!path.isAbsolute(modulepath)) modulepath = path.resolve(modulepath);
        return this._modulespath = modulepath;
    }

    get commandspath() {
        //TODO: clean up, either do this on set or outside of
        //here...
        if (this._commandspath) return this._commandspath;
        if (!this.loaders || !this.loaders.commands) return undefined;
        let modulepath = this.loaders.commands;
        if (!path.isAbsolute(modulepath)) modulepath = path.resolve(modulepath);
        return this._commandspath = modulepath;
    }

    /**
     * Convenience method to load configuration
     * objects.
     *
     * This uses the [simple-config-loader](http://github.com/goliatone/simple-config-loader) package
     * to load, merge, and resolve all configuration files
     * found in `options.dirname`.
     * For more information regarding the options that the configuration
     * loader takes, see [here](https://github.com/goliatone/simple-config-loader#options).
     *
     * @static
     * @param  {Object}   [options={}]    Default options
     * @param  {String}   options.basepath Path to main module
     * @param  {String}   [options.projectpath=process.cwd()]
     * @param  {String}   [options.dirname='config'] Name of directory holding configuration files
     * @param  {Object}   options.globOptions Options object used to match and ignore files.
     * @param  {String}   [options.globOptions.matchPatterh='**.js']
     * @param  {String}   [options.globOptions.ignorePattern='index.js']
     * @param  {Function}   options.getConfigFiles Function to collect configuration files.
     *                                             Uses `glob` under the hood.
     * @param  {Function}  options.getPackage   Function to retrieve package.json
     * @param  {String}   [options.configsPath='./']
     * @param  {Boolean}  [asObject=true] Return an object
     * @return {Object} Configuration object resulting from
     * merging all files in config directory.
     */
    static loadConfig(options = {}, asObject = true) {
        if (!options.basepath) options.basepath = getPathToMain();
        if (!options.projectpath) options.projectpath = getPathToMain();

        if (!Keypath.get(options, 'app.basepath', false)) {
            Keypath.set(options, 'app.basepath', options.basepath);
        }

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

        let loaderOptions = {
            config: options,
            basepath: projectpath,
            packagePath: projectpath + '/package'
        };

        /*
         * Our namespace is a little bit dirty :(
         * This is a list of keywords that if
         * present in the `options` object we
         * will pick and pass along with the
         * loader's options object.
         *
         * The rest of keys found in the original
         * options object are passed to the
         * loaders `options.config` object which
         * in turn is the default data for the
         * returned configuration object.
         */
        let pickKeywords = [
            'dirname',
            'globOptions',
            'getConfigFiles',
            'getPackage',
            'configsPath'
        ];

        pickKeywords.forEach(key => {
            if (!options[key]) return;
            loaderOptions[key] = options[key];
            delete options[key];
        });

        /**
         * If we are running our script from
         * outside the project directory we 
         * should cd into it so that paths
         * behave as expected :)
         */
        if (process.cwd() !== projectpath) {
            process.chdir(projectpath);
        }

        /*
         * Now, load configurations found on the project's
         * directory.
         */
        let config;

        try {
            config = configLoader(loaderOptions);
        } catch (error) {
            console.error('\n');
            console.error('Error loading project configuration files.');
            console.error('Project path: %s', projectpath);
            console.error('Main path: %s', getPathToMain());
            console.error('CWD path: %s', process.cwd());
            console.error('\n');
            console.error(error);
            process.exit(1);
        }

        if (asObject) return config._target;
        return config;
    }
}

Application.DEFAULTS = DEFAULTS;

module.exports = Application;