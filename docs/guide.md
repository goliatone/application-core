## core.io

**core.io** provides a structure to quickly prototype Node.js applications of _any type_, providing a set of guidelines and conventions to ease development.

In a way **core.io** aims to be a workflow rather than a framework or a library, providing a common application structure regardless if the application is web, desktop, or data focused.

**core.io** provides basic tools which are useful in any context like configuration management, logging, dependency management, a REPL.

Following simple conventions on how files are named and where are placed **core.io** will auto-load, auto-configure, and auto-wire components.

The heart of **core.io** is the [application context](#application-core), which you can extend directly with custom logic or indirectly with plugins[ as building blocks].


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

A lot of the nomenclature used here is being used rather loosely, instead of making up new words we try to reuse terms already in use elsewhere which might be similar enough to provide some context if we are familiar with them.

**core.io** prefers to be pragmatic over correct, and often times takes the shortest path or the naive approach to solve problems as they come and not before. That is, all features are here because they are being used extensively and provide a clear benefit.

**core.io** main goal is to speed up development and to provide a solid platform to quickly build complex prototypes with the least amount of friction. One way to achieve this is to promote code reuse by providing a plug-and-play module system.

Don't get too hung up on the terms and how they differ from the use by frameworks or languages you are familiar with.

### Application Context

During the initialization phase of modules **core.io** will call the module's
`init` method with two arguments. The first argument is an instance of your application, this instance is called the application context and the convention is to name the argument `context`.

**core.io** intends to not pollute the global namespace and modules should not have strong dependencies on **core.io** beyond the `init` function.

This context acts a little bit like an [IOC][ioc] container in that is intended to make your code modular and provide a point to extend your application at runtime.

You will use it to `resolve` dependencies at runtime, and to `provide` new capabilities to your application.

An example of this would be the following hypothetical module:

```js
module.exports.init = function(context, config) {
    return context.resolve('persistence', 'server').then(() => {
        context.provide('crud', crud.initialize(context.server));
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

**core.io** configuration process is purportedly simple, a **core.io** application takes an options object and **core.io** does not really care how you produce that object.

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
let environment = context.config.get('environment', 'production');
```

It's more useful when you need to access a deeply nested object:

```js
let prompt = context.config.get('repl.options.prompt', 'poke-repl >');
```

#### Module configuration

When **core.io** registers a module, first it will require the module and then will look for a key in `context.config` that matches the modules `moduleId`. It will then call `module.init` with a reference to the value of this key.

```js
let moduleId = 'persistence';
let config = this.config.get(moduleId, {});
module.init(this, config);
```

#### Configuration Files

`Application.loadConfig` will load all configuration files found inside the `./config` directory.

It will then load the files, and merge them in a single object using the file name as a key.

If you have a configuration file that has the same name as a given module's `moduleId` then the contents of that file will be passed to the module during the initialization phase.

#### Supporting Different Environment

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
Anatomy of a module.

#### Modules Names
* sanitizeName:

* moduleid: If no module id is provided in the configuration file, the sanitized name will be used.

* alias: Modules can export an `alias` property that will be used instead of the filename.

Conventions around modules names:
* configuration file: matching configuration files will de passed to module
* child logger: receives the name of the module.


#### Core Modules
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

When you are initializing your modules, in the `init` function, you can access the logger using the `context.getLogger`



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

### Configuration

Configuration files located in the [`config/`](#configuration-loader) folder of projects will be merged together in a single object, which will be available at runtime on as a property of your application instance, i.e. `core.config`.

The top-level keys on the `core.config` (i.e. `core.config.repl`) object correspond to a particular configuration file name under your `config/` directory (i.e. `config/repl.js`). Most individual configuration files are specific to a module, with the exception of `config/app.js`  which should hold options for your current application, i.e. application name.

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

#### Application configuration file

* banner: String|Function

The `./config/app.js` is different than other configuration files in that application will extend itself with the object like if it was a mixin.

### Modules

* alias: if a module exports an alias property, it will be used to register the module instead of the default given name.


#### Core modules

This is the list of core modules bundled with Kiko:

* Logger
* REPL
* Dispatcher

### Autoloading

Autoloading refers to the fact that **core.io** will take files placed in specific directories within your project directory and treat them

##### Module Loader

##### Commands Loader

##### Configuration Loader
###### Solving Configuration Dependencies


#### Logger

options:
* muteConsole
* wrapConsole

#### REPL
poke-repl

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





## API

### Application

*

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

1) Load Configuration

2) Load Core Modules
After all configuration files are [loaded](#configuration-loader) and it's [configuration dependencies have been solved](#solving-configuration-dependencies) **core.io** will load the [core modules](#core-modules).

3) Load Application Modules

4) Load Application Commands

5) Run Hook

6) Initialize App Runtime



[ioc]:https://en.wikipedia.org/wiki/Inversion_of_control
[envset]:https://github.com/goliatone/envset
[mixin]:https://www.joezimjs.com/javascript/javascript-mixins-functional-inheritance/
[winston]:https://github.com/winstonjs/winston
