## Kiko

**Kiko** provides a structure to quickly prototype applications of any type, providing a set of guidelines and conventions to ease development. **Kiko** aims to be a workflow rather than a framework,

The heart of **Kiko** is the [application-core](#application-core), which you can textend with custom logic and with plugins. Kiko will take care of basic things like configuration management, logging, dependency management, and it provides a nice REPL.

Conventions on how files are named and where they are placed are used to do auto-loading, auto-configuration, and auto-wiring.



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



**Kiko** provides a convenience method to collect this configuration files.

```javascript
var Application = require('kiko').Application;

var config = Application.loadConfig({

}, true);

var app = new Application({config});
```



### Modules



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

#### Dispatcher

The `dispatcher` module extends the `application-core` with two distinct behaviors:

* hooks
* chained events.

Hooks provide lifecycle events

##### Hooks

##### Chained Events





## API

### Application Core
