## Kiko

**core.io** provides a structure to quickly prototype Node.js applications of _any type_, providing a set of guidelines and conventions to ease development.

In a way **core.io** aims to be more of a workflow rather than a framework or a library, providing a common application structure regardless if the application is web, desktop, or data focused.

**core.io** provides basic tools which are useful in any context like configuration management, logging, dependency management, and it provides a nice REPL.

Following simple conventions on how files are named and where are placed **core.io** will auto-load, auto-configure, and auto-wire components.

The heart of **core.io** is the [application context](#application-core), which you can extend directly with custom logic or indirectly with plugins[ as building blocks].


## Main interface
The core concept is this:

```js
function(context, config){}
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

##### Module Loader

##### Commands Loader

##### Configuration Loader



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

### Application Core
