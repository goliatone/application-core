## core.io

**core.io** provides a structure to quickly prototype Node.js applications of _any type_, providing a set of guidelines and conventions to ease development.

In a way **core.io** aims to be a workflow rather than a framework by providing a common application structure regardless if the application is web, desktop, or data focused.

**core.io** provides basic building blocks which are useful in any context and help with command tasks like configuration management, logging, dependency management and more basic needs of most applications.

The heart of **core.io** is the [application context](#application-core), which you can extend directly with custom logic or indirectly with modules.

Modules are intended to encapsulate code and make it portable. They also serve as glue to integrate libraries into your project.

Following simple conventions on how files are named and where are placed **core.io** will auto-load, auto-configure, and auto-wire components.



1. [Getting Started](#getting-started)
2. [Reference](#reference)
3. [Concepts](#concepts)
4. [Project Structure](#project-structure)

## Getting Started
### Installation
### Create Sample Application
### Run

## Reference

### Application
#### Application Context
#### Application Lifecycle

### Configuration

### Modules
#### Core Modules
#### Extended Modules

### Commands

### Autoloading
#### Module Loader
#### Commands Loader
#### Configuration Loader
#### Model Loader

## Concepts

A lot of the nomenclature in this document is being used rather loosely, instead of making up new words we try to reuse terms already in use elsewhere which might refer to similar enough concepts to provide context to those who are familiar with them.

**core.io** prefers to be pragmatic over correct, and often times takes the shortest path or the naive approach to solve problems as they come and not before there are such problems. That is, all features are here because they are being used extensively and provide a clear benefit.

**core.io** main goal is to speed up development and to provide a solid platform to quickly build complex prototypes with the least amount of friction. One way to achieve this is to promote code reuse by providing a plug-and-play module system.

Don't get too hung up on the terms and how they differ from the use by frameworks or languages you are familiar with.

### Mixins and overrides
Through most classes in **core.io** we follow this pragmatic convention:

```js
class MyClass {
    constructor(options) {
        options = extend({}, MyClass.DEFAULTS, options);
        if(options.autoinitialize) {
            this.init(options);
        }
    }

    init(options={}) {
        extend(this, options);
    }
}

MyClass.DEFAULTS = {
    getName: function() {

    },
    name: 'MyClass'
};
```

This is simple, powerful, and can be somehow dangerous if you don't fully understand how it works.

It's purpose is to give the developer total control over the behavior of `MyClass` with everything that it entails. Use with responsibility.


### Application Context

During the initialization phase of modules **core.io** will call the module's
`init` method with two arguments. The first argument is an instance of your application, this instance is called the application context and the convention is to name the argument `context`.

**core.io** intends to not pollute the global namespace and modules should not have strong dependencies on **core.io** beyond the `init` function.

This context acts a little bit like an [IOC][ioc] container in that is intended to make your code modular and provide a point to extend your application at runtime.

You will use it to `resolve` dependencies at runtime, and to `provide` new capabilities to your application.

An example of this would be the following hypothetical module:

```js
module.exports.init = function(context, config) {
    const crud = new Crud(config);

    return context.resolve('persistence', 'server').then(() => {
        context.provide(crud.moduleId, crud.initialize(context.server));
    }).catch(context.handleModuleError.bind(true));
};
```

#### register
#### resolve
#### provide
#### command
#### onceRegistered

### Configuration

While the intention of **core.io** is to adhere to the idea of convention over configuration, you still have full control over most aspects of your application by overriding the provided default values.

**core.io** configuration process is purportedly simple, a **core.io** application takes an options object with configuration and overrdies. **core.io** does not really care how you produce that object.

However, the Application class provides you with a helpful method to collect, merge, and resolve dependencies of configuration files located in the `./cofig` folder of projects.

The resulting configuration object will be made available at runtime on the application context as `context.config`.

When you create a new application instance you can pass an options object to it's constructor.

This options object has two purposes. If you define a configuration key, it's value will be added to `context.config`.

All other keys in this object will extend the application instance, like a [mixin][mixin]. The application instance extends itself with this object in it's `init` method which is called directly from the constructor.

You can use it to override methods before the instance makes use of any of them or to add new methods to your instance.

```javascript
var App = require('core.io').Application;

/*
 * Autload and merge files inside
 * `config/`
 */
var config = App.loadConfig({
    //...default values
}, true);

var app = new App({
    myCustomMethod: function(e) {
        this.emit('custom.event', e);
    },
    config: config
});

app.myCustomMethod({});
```

#### Configuration instance

For convenience **core.io** wraps the `config` object with some a `get` and `set` methods.

This is so that you can access a deep object without fear of some object in the path not being defined. It also enables you to provide a default value for such cases.

```js
//Get the value of "environment", return "production" if undefined.
let environment = context.config.get('environment', 'production');
```

It's more useful when you need to access a deeply nested object:

```js
//Get the value of "repl.options.prompt", return "poke-repl >" if undefined.
let prompt = context.config.get('repl.options.prompt', 'poke-repl >');
```

#### Module configuration

When **core.io** registers a module, first it will `require` the module and then will look for a key in `context.config` that matches the module's [moduleId](#modules-names). It will then call `module.init` with a reference to the value of this key.

```js
let moduleId = 'persistence';
let config = this.config.get(moduleId, {});
module.init(this, config);
```

#### Configuration Files

`Application.loadConfig` will load all configuration files found inside the `./config` directory.

It will then load the files, and merge them in a single object using the file name as a key.

If you have a configuration file that has the same name as a given module's `moduleId` then the contents of that file will be passed to the module during the initialization phase.

If your configuration file exports an `afterSolver` function it will be called once the configuration **solve** routine has been concluded.

In a configuration file you can reference values from the same configuration object or from other configuration objects. Using two different syntaxes you can reference strings or objects:

* Strings: `${app.name}`
* Objects: `@{app.locals}`

The configuration **solve** routine will solve all cross references between configuration files. It runs after merging all files into a single object.

As an example, `${app.name}` will be resolved to `config.app.name`:

* `config/app.js`:

```javascript
module.exports = {
  name: 'MyApplication'
};
```

* `config/repl.js`:

```javascript
module.exports = {
  prompt: '${app.name}'
};
```

There is also the possibility of processing the contents of a configuration file after it has been merged and loaded. Configuration files are regular JavaScript files, which means you can build different logic into them.

If you export a function named `afterSolver` it will be called after all dependencies have been resolved. The function will be called with the whole configuration object.

```js
module.exports.afterSolver = function(config) {
    config.set('amqp.amqp', require('amqp'));
};
```

Under the hood **core.io** uses the [simple config loader][scl] package. You can read more in the packages repository.

**core.io** provides a convenience method to collect this configuration files.

```javascript
var App = require('core.io').Application;

/*
 * Autload and merge files inside
 * `config/`
 */
var config = App.loadConfig({
    //...default values
}, true);

var app = new App({
    //Top level attributes will extend the application
    //instance.
    myCustomMethod: function(){},
    config: config
});
```

#### Supporting Different Environments

Another aspect in which **core.io** tries to simplify the configuration process is by how it supports different development environments, like **staging**, **development**, **production**, etc.

In short: _it does not_.

To be more precise, **core.io** takes a very pragmatic stance and does not provide any way to (directly) manage different environments but has some recommendations that make having configuration files per environment unnecessary.

A lot of the things that need to change on each environment are _secrets_ like service tokens or user keys. You can manage those by using `process.env` and environment variables.

If you use the provided `Application.loadConfig` then your configuration files are javascript files which, obviously, can have logic in it.

Another benefit of `Application.loadConfig` is that you can reference other parts of you configuration files and solve them at runtime, making your configuration files modular.

You can also make use of the `afterSolver` facility which gets access to the merged configuration object. In it you can access the `environment` key which holds the value of the current environment and modify your configuration file at runtime.

Ideally your configuration files should be lightweight on the logic in order to reduce possible errors and keep things simple, but you are free to do as you please.

You can also use an environment manger like [envset][envset] to dynamically populate your `process.env` variables. All you need is an `.envset` file where you define your environments, environment variables and their values:

```
[production]
NODE_AWS_SECRET_ACCESS_KEY=FS40N0QY22p2bpciAh7wuAeHjJURgXIBQ2cGodpJD3FRjw2EyYGjyXpi73Ld8zWO
NODE_AWS_ACCESS_KEY_ID=LSLhv74Q1vH8auQKUt5pFwnix0FUl0Ml
NODE_HONEYBADGER_KEY=LCgZgqsxKfhO
NODE_POSTGRES_ENDPOINT=50.23.54.25
NODE_POSTGRES_DATABASE=myproject
NODE_POSTGRES_PSWD=Pa$sW03d
NODE_POSTGRES_USER=myproject

[development]
NODE_AWS_SECRET_ACCESS_KEY=HN5ITok3lDaA1ASHxtEpy1U9XCjZwThmfgoIYZk8bkOqc5yk6sT7AWd3ooNeRFV9
NODE_AWS_ACCESS_KEY_ID=m35W4PGGVZfj1gOxYvztFxBD5F2605B3
NODE_HONEYBADGER_KEY=f3MNPUhZoki6
NODE_POSTGRES_ENDPOINT=localhost
NODE_POSTGRES_DATABASE=postgres
NODE_POSTGRES_PSWD=postgres
NODE_POSTGRES_USER=postgres
```

If you use `.envset` remember to add it to your `.gitignore` file.

Lastly but more importantly, you can **BYOS**- bring your own solution- and use whatever configuration system you prefer.


### CLI

### Modules
A Node.js package is a convenient way to organize, distribute and reuse source code between Node.js programs.

A Node.js module is anything that can loaded with `require`.

**core.io** modules are intended to encapsulate logic in a way that can be reused between projects, in that sense **core.io** modules are similar to [npm packages][npm-packages].

Perhaps the modules contain logic specific to your application since modules are used to integrate packages into the application.  


#### Defining a **core.io** Module
**core.io** modules need to conform to a simple interface.

#### Modules Names
* sanitizeName: It ensures the resulting string is a valid JavaScript variable name.

* alias: Modules can export an `alias` property that will be used instead of the filename.

* moduleid: If no module id is provided in the configuration file, the sanitized name will be used.

Conventions around modules names:
* configuration file: matching configuration files will de passed to module
* child logger: receives the name of the module.


#### Core Modules
Core modules are optional and can be replaced by any module as long as it provides the same interface.

Some are optional, like the REPL module. If you dont needed you can remove it from the list of `coremodules` using the configuration object that you pass to the application instance during the initialization of your program, in the entry point file.

##### REPL

##### Logger

**core.io** provides a logger to the application context as `context.logger` and is the module with the highest priority, meaning it will be available on first run. Under the hood the logger wraps [winston][winston] and extends it with some extra features:

* child loggers
* filters
* the ability to mute all output
* the ability to have focus one child logger
* it can optionally wrap the console so that it has the same format
* it can disable `console` output

When a module is loaded a child logger is created and assigned to the module. You access child loggers via the `context.logger.getLogger(loggerId)` method, where `loggerId` is the name of the logger.

Each call to `getLogger` will return the same instance, and it's output is identified by the logger's name:

```
INFO  [23:28:48] ├── core         : Created logger "core"...
INFO  [23:28:48] ├── app          : Created logger "app"...
INFO  [23:28:48] ├── console      : Created logger "console"...
WARN  [23:28:48] ├── core         : Register: we are going to override plugin logger
INFO  [23:28:48] ├── core         : Mount Handler: module "errors" mounted...
INFO  [23:28:48] ├── core         : Mount Handler: module "dispatcher" mounted...
INFO  [23:28:48] ├── dispatcher   : Created logger "dispatcher"...
DEBUG [23:28:48] ├── dispatcher   : Module "dispatcher" ready...
```

Each application has at least two loggers; core and app. Using the built in logger is optional, however if you decide to log from within your modules is a good idea to use the same provided logger.

**TIP**: When you are initializing your modules, in the `init` function, you can access the logger using the `context.getLogger`

You can wrap the `console` so it has the same output as the regular logger output and also you can apply filters.

You can have an active logger, so that only the log output of a given logger is shown.

You can mute all output.

options:
* muteConsole: Uses [noop-console][noop-console] module.
* wrapConsole
* handlingExceptions

You can set this values by default using the `./config/logger.js` configuration file or you can interact with the logger through the [REPL](#repl).

###### Configuration

The default configuration for the logger includes three different transports:
* Console: log level **silly**.
* File Exceptions: catch and log uncaughtException events
* File Debug: Log level debug. Disabled by default in production.

To override the default configuration you can create a `./config/logger.js` configuration file.

##### Dispatcher

### Autoloading
### Extending Application Context
### Environment Variables
#### Envset

## Project Structure

---
## Main interface

Much like [connect][connect] where you have a simple interface for all middleware, **core.io** modules all have to conform to a simple interface.

Each module has to provide an `init` function which will take two arguments; `context`, and `config`.

`context` is an instance of a core.io application, and `config` is the [configuration object](#configuration) for that module.

Inside the `init` function is where you would perform all the wiring needed for the module to integrate with your application. Some modules will extend the application by providing new functionality. See [extending context](#extending-context) for more information and examples.

`init` acts as a middle tier between **core.io** and external libraries.

```js
module.exports.init = function(context, config) {
    const repl = require('poke-repl');
    context.provide('repl', repl);
};
```

**core.io** does not pollute the `global` namespace, the intended way to access the functionality is by keeping a reference of the `context` object if is necessary.

### Dependencies
If your module has dependencies most of the time **core.io** can handle those.
It can wait for dependencies

#### Promises

### Extending context

The **core.io** application context exposes a function to provide new functionality through modules.

```js
context.provide(name, capability);
```


https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/

### Project Layout

```mark
.
├── config
|    ├── app.js
|    ├── logger.js
|    ├── repl.js
|    ├── ...
|    └── persistence.js
├── modules
|    ├── dashboard
|    ├── admin
|    └── persistence.js
├── commands
|    ├── run.post.js
|    ├── user.create.js
|    └── seed.create.js
└── index.js
```

The entry point file is named `index.js` by default/convention, but basically you can use anything that would work in a `npm start` script.

### Configuration

Configuration files located in the [`config/`](#configuration-loader) folder of projects will be merged together in a single object, which will be available at runtime on as a property of your application instance, i.e. `core.config`.

The top-level keys on the `core.config` (i.e. `core.config.repl`) object correspond to a particular configuration file name under your `config/` directory (i.e. `config/repl.js`). Most individual configuration files are specific to a module, with the exception of `config/app.js`  which should hold options for your current application, like the application's name, it's base directory, environment in run under, etc.

The intention of these files is to provide modules with configuration options. When a module is loaded, it will be called with the application's instance and a `config` top-level key that matches the module's name.

Your configuration files can contain references to a value found in other configuration files  using special a simple syntax that will get resolved after merging all files into a single object.

As an example, `${moduleA.name}` will be resolved with `config.moduleA.name`:

* `config/moduleA.js`:

```javascript
module.exports = {
  name: 'ModuleA'
};
```

*  `config/moduleB.js`:

```javascript
module.exports = {
  prompt: '${moduleA.name}'
};
```

**core.io** provides a convenience method to collect this configuration files.

```javascript
var Application = require('kiko').Application;

/*
 * Autload and merge files inside
 * `config/`
 */
var config = Application.loadConfig({
    //...default values
}, true);

var app = new Application({config});
```

#### Configuration Extra Properties

The configuration process attaches two properties to the config object:

* package: contents of `package.json` file minus the **readme**
* environment: value of `process.env.NODE_ENV`

#### Application configuration file

* banner: String|Function

The `./config/app.js` is different than other configuration files in that application will extend itself with the object like if it was a mixin.

### Modules

* alias: if a module exports an alias property, it will be used to register the module instead of the default given name.


#### Core modules

This is the list of core modules bundled with **core.io**:

* Logger
* Errors
* Monitoring
* Dispatcher
* REPL

Core modules are loaded first and made available for all user modules. You can override this list using a `coremodules` key in the configuration object you initialize your instance with:

```js
var config = Application.loadConfig({
    coremodules: ['./logger', './errors', './dispatcher']
}, true);

var app = new Application({config});
```
Here we removed the [monitoring](#monitoring-module) and the [REPL](#repl-module).

### Autoloading

Autoloading refers to the fact that **core.io** will take files placed in specific directories within your project directory and treat them

##### Module Loader

##### Commands Loader

##### Configuration Loader

###### Solving Configuration Dependencies
Configuration files can have interpolated values where you reference the value of any attribute of the configuration object using the attribute's keypath.

You reference objects or properties by their keypath. A keypath is a string representing the location of a piece of data.

```js
var data = {
    user: {
        name: 'Peperone',
        address: {
            city: 'New York'
        }
    }
};
```

You can reference strings or objects using two different syntaxes:

* Object interpolation: `@{user}` or `@{user.address}`
* String interpolation: `${user.name}` or `${user.address.city}`

#### Logger

options:
* muteConsole
* wrapConsole

#### Banner
In development mode, when the application boots there is a banner that shows up in the output. You can customize it using any online ASCII generator [like this one][ascii-art].

The banner can display any information using [configuration interpolated values](#solving-configuration-dependencies).
To customize the banner you need to create a file `./config/banner.txt` with your ASCII art and then reference it from `./config/app.js`.

```javascript
const banner = require('fs').readFileSync('./config/banner.txt', 'utf-8');

module.exports = {
    banner,
    name: 'AppCore',
    environment: process.env.NODE_ENV
};
```


An example banner could look like this:
```
[32m------------------------------------------------------------------
------------------------------------------------------------------

     **                       ******                          **
    ****    ******  ******   **////**                        /**
   **//**  /**///**/**///** **    //   ******  ******  ***** /**
  **  //** /**  /**/**  /**/**        **////**//**//* **///**/**
 **********/****** /****** /**       /**   /** /** / /*******/**
/**//////**/**///  /**///  //**    **/**   /** /**   /**//// //
/**     /**/**     /**      //****** //****** /***   //****** **
//      // //      //        //////   //////  ///     ////// //


           Name: ${app.name}
        Version: ${package.version}
    Environment: ${environment}
----------------------------------------    v${package.version}    ------------
------------------------------------------------------------------
[39m
```

And it would render like this:
```
------------------------------------------------------------------
------------------------------------------------------------------

     **                       ******                          **
    ****    ******  ******   **////**                        /**
   **//**  /**///**/**///** **    //   ******  ******  ***** /**
  **  //** /**  /**/**  /**/**        **////**//**//* **///**/**
 **********/****** /****** /**       /**   /** /** / /*******/**
/**//////**/**///  /**///  //**    **/**   /** /**   /**//// //
/**     /**/**     /**      //****** //****** /***   //****** **
//      // //      //        //////   //////  ///     ////// //


           Name: AppCore
        Version: 0.0.1
    Environment: development
----------------------------------------    v0.0.1    ------------
------------------------------------------------------------------
```

#### REPL

**core.io** bundles a REPL module that enables remote interaction with your application over a terminal window. You get access to the application instance, models, and any functionality that you decide to expose.

Some of the features:
* firewall
* basic auth
* TLS

You can learn more about the module at the repository, [poke-repl][poke].

The built in REPL exposes the application context- you can access it if you type `app`- and through it you can access all the modules and the configuration object.

You can expose properties and functions by extending the REPL instance.

```js
context.resolve('repl').then((repl) => {
    repl.context.myCustomCommand = function() {
        console.log('TODO: We should really thing of a better example!');
    };
});
```

#### REPL Configuration Options

* enabled: Boolean Default true.

You can disable the REPL by setting the `enabled` property to `false`.

##### Banner
You can customize the banner that is displayed in the console output during initialization of your application. Mostly is about aesthetics but you can use it to display some useful information regarding the connection.

```
╔═════════════════════════════════════════════════════════════════════╗
║                      poke-repl remote console √                    ║
║                                                                    ║
║              All connections are monitored and recorded            ║
║      Disconnect \u001b[1mINMEDIATELY\u001b[22m if you are not an authorized user      ║
╚════════════════════════════════════════════════════════════════════╝
```

There is an example [here][poke-repl-banner]

You can customize the connection banner, the prompt, and more. A sample configuration file looks like this:

```js
'use strict';

let header = require('fs').readFileSync('./config/repl-banner.txt', 'utf-8');

module.exports = {
    enabled: true,
    metadata: {
        name: '${app.name}',
        version: '${package.version}',
        environment: '${app.environment}',
    },
    firewall: {
        rules: [
            {ip: '', subnet: 14, rule: 'ACCEPT'}
        ]
    },
    auth: {
       enabled: true,
       users:[{
           username: 'admin',
           password: 'secret!'
       }]
   },
   tls: {
       key:  './tls/client/private-key.pem',
        cert: './tls/client/certificate.pem',
        ca: [
            './tls/server/certificate.pem'
        ]
   },
    options: {
        prompt: '\u001b[33m ${app.name} > \u001b[39m',
        // header: header
    },
    port: process.env.NODE_REPL_PORT,
};
```

#### Dispatcher

The `dispatcher` module extends the `application-core` with two distinct behaviors:

* hooks
* chained events.

Hooks provide lifecycle events

##### Hooks
A `hook` is an event with a lifecycle to which you can attach listeners to.

Core hooks and module hooks.

After the application context is configured and wired it will fire the run `hook`.


##### Chained Events


## External modules

There is a list of modules that are not bundled by default but that provide great functionality albeit functionality that might not always be needed for every application.

* [core.io-persistence][core-persistence]
* [core.io-express-server][core-server]
* [core.io-data-manager][core-data]
* [core.io-filesync][core-sync]
* [core.io-express-auth][core-auth]
* [core.io-express-crud][core-crud]

## API

### Application

**core.io** exposes an Application class which is intended to be used indirectly as exposed through the application's lifecycle.

#### Configuration Options

Default values:

* logger: console,
* autorun: true,
* autoinitialize: true,
* exitOnError: true,
* name: 'Application',
* sanitizeName: sanitizeName,
* registerReadyEvent: 'registered',
* coremodules: ['./logger', './errors', './dispatcher', './monitoring', './repl'],
* basepath: `process.cwd`

#### Lifecycle

One of the main functions of **core.io** is to manage your application's lifecycle. **core.io** takes over during boot and after it's duties are completed will give focus to your application.

0) Call entry point file

1) Load Configuration

2) Load Core Modules
After all configuration files are [loaded](#configuration-loader) and it's [configuration dependencies have been solved](#solving-configuration-dependencies) **core.io** will load the [core modules](#core-modules).

3) Load Application Modules

4) Load Application Commands

5) Run Hook

6) Initialize App Runtime


[core-persistence]:https://github.com/goliatone/core.io-persistence
[core-server]:https://github.com/goliatone/core.io-express-server
[core-data]:https://github.com/goliatone/core.io-data-manager
[core-sync]:https://github.com/goliatone/core.io-filesync
[core-auth]:https://github.com/goliatone/core.io-express-auth
[core-crud]:https://github.com/goliatone/core.io-crud

[poke]:https://github.com/goliatone/poke-repl
[noop-console]:https://github.com/goliatone/noop-console
[scl]:https://github.com/goliatone/simple-config-loader
[ioc]:https://en.wikipedia.org/wiki/Inversion_of_control
[envset]:https://github.com/goliatone/envset
[mixin]:https://www.joezimjs.com/javascript/javascript-mixins-functional-inheritance/
[winston]:https://github.com/winstonjs/winston
[npm-packages]:https://docs.npmjs.com/how-npm-works/packages
[poke-repl-banner]:https://github.com/goliatone/poke-repl/tree/master/examples
[ascii-art]:http://www.network-science.de/ascii/
