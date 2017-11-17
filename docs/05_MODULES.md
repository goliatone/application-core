### Modules

A Node.js package is a convenient way to organize, distribute and reuse source code between Node.js programs.

A Node.js module is anything that can be loaded with `require`.

**core.io** modules are intended to encapsulate logic in a way that can be reused between projects, in that sense **core.io** modules are similar to [npm packages][npm-packages].

Perhaps the modules contain logic specific to your application since modules are used to integrate packages into the application. You could think about **modules** as plugins or middleware.

#### Defining a **core.io** Module

**core.io** modules need to conform to a simple interface.

* They need to expose an `init` function.
* The init function will be given two arguments: `context` and `config`.

For the most part, that's it. There are more options like exporting an `alias` or a `priority` property.

#### Modules Names

* sanitizeName: It ensures the resulting string is a valid JavaScript variable name.

* alias: Modules can export an `alias` property that will be used instead of the filename.

* moduleid: If no module id is provided in the configuration file, the sanitized name will be used.

Conventions around modules names:
* configuration file: matching configuration files will de passed to module.
* child logger: receives the name of the module.

### Modules

A module adds a specific feature to an existing application context, providing a means to extend your application with specific behavior for a given project in an encapsulated way.

All modules are stored in the **modules** folder of your application project directory.

 thus maximizing the amount of code you can reuse between applications.

Modules follow a simple convention: they should export an init function that take an instance of the application `context` and a configuration object as arguments.

Modules should have a name that is unique in your application. This name will be used to access the module later on from other parts of your application.
By default the module loader will infer this name from the file that registers the module.

Your module does not need to return anything, but if it does it should be either an object or a Promise.

If you return an object, you then will be able to access it through the application instance- `app[moduleName]`.

If you return a `Promise` instance, then once it resolves the process is the same.

Once the module is registered, the app instance will emit an event: `moduleName + '.' + config.app.registerReadyEvent`, in the case for the core logger module and using the default value for `registerReadyEvent` the event type would be `logger.registered`.

Once all core plugins are loaded, the application emits the event `coreplugins.registered`.

#### Module autoloading


#### Module instantiation

The modules instantiation follows a simple registration process.

* users module:

**./modules/users.js**
```js
module.exports.init = function(core, config) {
    ...
    return users;
};
```


```js
core.once('users.registered', function() {

});
```

#### Modules configuration

Configuration files located in the [`config/`](#configuration-loader) folder of projects will be merged together in a single object, which will be available at runtime as a property of your application instance, i.e. `context.config`.

The top-level keys on the `context.config` (i.e. `context.config.repl`) object correspond to a particular configuration file name under your `config/` directory (i.e. `config/repl.js`). Most individual configuration files are specific to a module, with the exception of `config/app.js`  which should hold options for your current application, like the application's name, it's base directory, environment in run under, etc.

The intention of these files is to provide modules with configuration options. When a module is loaded, it will be called with the application's instance and a `config` top-level key that matches the module's name.
