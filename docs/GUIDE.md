
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

A lot of the nomenclature in this document is being used rather loosely, instead of making up new words we try to reuse terms already in use elsewhere which might refer to similar enough concepts to provide context to those who are familiar with them. If you are learning be mindful that some concepts are stretched or abused to fit the narrative. Be warned.

Rather than _correct_ **core.io** prefers to be _pragmatic_ , often taking the shortest path or a naive approach to solve problems as they come as opposed to engineering for theoretical-future-problems. That is, all features of **core.io** are being used extensively and provide a clear benefit by solving a specific problem.

**core.io**'s main goal is to **speed up development and to provide a solid platform to quickly build complex prototypes with the least amount of friction**. One way to achieve this is to promote code reuse by providing a plug-and-play module system.

The spirit is reminiscent of [HMVC][wiki-hmvc], [Command pattern][wiki-command-pattern], or [Front Controller][wiki-front] pattern.  

Don't get too hung up on the terms and how they differ from the use by frameworks or languages you are familiar with.

## JavaScript patterns

The following are patterns extensively used across **core.io**. A brief introduction for those not familiar with the concepts.

#### Defaults, mixins and overrides

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
    autoinitialize: true,
    getName: function() {
        return this.name;
    },
    name: 'MyClass'
};
```

Generally speaking, properties in the `DEFAULTS` object are intended to provide sane defaults but explicitly show what things are expected to be overriden by the developer.

You can also use the constructor's `options` argument to extend the base object with new functions and variables.

In the previous example, a new instance of `MyClass` will have a `getName` method made available to it.

```js
let myInstance = new MyClass({
    myCustomMethod: function(){
        console.log(this.name);
    }
});

myInstance.getName();

myInstance.myCustomMethod();  
```

This is simple, powerful. However it can be somehow dangerous if you don't fully understand how it works and it's side effects.

It's purpose is to give the developer total control over the behavior of `MyClass` with everything that it entails. Use with responsibility.



#### register
We register modules with the application context to initialize, configure, and make the module available to the rest of the application.

Internally, **core.io** manages dependencies of your modules and their load order is dictated by the dependency level, loading dependent modules first. However, at this point, the dependency chain has been already solved.

The specific steps taken during the `register` call are:

* Normalization of the module name: Name gets sanitized and if the module exposes an alias attribute it will be registered using the alias.
* Call `init` function of the module. It passes any configuration object found with some defaults, `moduleid`, and a logger instance.
* Register an error handler: If the module instance is an EventEmitter, it will register an `error` listener to handle module errors.

Once the process is completed, context will emit an event of type: `name` + `context.registerReadyEvent` i.e. `repl.registered`

#### onceRegistered

Register a callback to get notfied once module <id> has been registered.

Once a module is registered the application instance will fire an event with type `<moduleId>.registered`, `logger.registred` for the logger module.

We can't guarantee the order in which modules are going to be loaded since it depends on dependency chain resolution. It might be the case that a module A depends on module B, module A loads after module B. Using `onceRegistered` module A would still get notified.

#### resolve
`resolve` takes either a string or an Array of strings that represent a module name.

Once the provided module id has been registered, the returned `Promise` is resolved.

#### provide
This will add `attr` to the application context and ensure that it does not get overwritten unnoticeably.

If we really want to overwrite the given attribute, we can still do so, but explicitly using Object.defineProperty

#### command

Register a command for the given event type.

Command handler functions get bound to the application context.

### CLI

### Autoloading
### Extending Application Context
### Environment Variables
#### Envset

---


## Project Structure

One of the main goals of **core.io** is to provide a consistent way to structure your projects. **core.io** organizes your code by placing them under predetermined directories that will group files with a similar role.

That is to say, all modules will live under a **modules** directory, all configuration files under a **config** directory, etc.

By default it will create three directories; config, modules, and commands. It will also create an **index.js** file, a **package.json** file, and a `taskfile` file.

`package.json` is a standard **Node.js** file with no special properties.

`taskfile` is a bash file that follows [the Taskfile specification][taskfile] and is used to provide simple tasks. It's provided as a convenience, some projects might warrant a more sophisticated- and complex!- task runner or bundler.

`index.js` is the application entry point, i.e. you could start your application by calling `node index.js`. You can extend your main `Application` instance here, however it's recommended that you do so by leveraging modules instead.

### Project Layout

```mark
.
├── config
|    ├── app.banner.txt
|    ├── app.js
|    ├── logger.js
|    ├── repl-banner.txt
|    ├── repl.js
|    ├── ...
|    └── persistence.js (*)
|
├── modules
|    ├── dashboard
|    ├── admin
|    └── persistence.js
|
├── commands
|    ├── run.post.js
|    ├── user.create.js
|    └── seed.create.js
|
├── package.json
├── taskfile
└── index.js
```

The entry point file is named `index.js` by default/convention, but basically you can use anything that would work in a `npm start` script.

### Configuration

Configuration files located in the [`config/`](#configuration-loader) folder of projects will be merged together in a single object, which will be available at runtime as a property of your application instance, i.e. `context.config`.

The top-level keys on the `context.config` (i.e. `context.config.repl`) object correspond to a particular configuration file name under your `config/` directory (i.e. `config/repl.js`). Most individual configuration files are specific to a module, with the exception of `config/app.js`  which should hold options for your current application, like the application's name, it's base directory, environment in run under, etc.

The intention of these files is to provide modules with configuration options. When a module is loaded, it will be called with the application's instance and a `config` top-level key that matches the module's name.

Your configuration files can contain references to a value found in other configuration files using a simple syntax that will get resolved after merging all files into a single object.

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

**core.io** provides a convenience method to collect these configuration files.

```javascript
const Application = require('application-core').Application;

/*
 * Autoload and merge files inside
 * `config/`
 */
const config = Application.loadConfig({
    //...default values
}, true);

const app = new Application({config});
```

#### Configuration Extra Properties

The configuration process attaches two properties to the config object:

* package: contents of `package.json` file minus the **readme**
* environment: value of `process.env.NODE_ENV`

#### Application configuration file

* banner: String|Function

The `./config/app.js` is different than other configuration files in that the application will extend itself with the object like if it was a mixin.

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

Autoloading refers to a **core.io** feature which take files placed in specific directories within your project then _load_ and _wire_ the files into your project, or application context to be more precise.

As an example, all files under `./config` can be autoloaded if you use the `Application.loadConfig` static method.

All files under the `./commands` directory will be `require`d and registered as commands.

If you are using the [persistence][core-persistence] module, then all files under the `./models` directory will be registered as models.

But mainly, all valid modules found in the `./modules` directory will be loaded and registered with the application context, meaning that to add a new module to your application you simply need to place it in the `./modules` directory and then **core.io** will do the rest.

Note that the dependency solving cycle happens statically at runtime during the boot process of your application, so to detect a new module you need to stop and restart your application.

##### Module Loader

As explained earlier, all valid modules found in the `modules` directory will be required and then registered with the application context.

A valid module is either a javascript file exporting an `init` function or a directory with an **index.js** file exporting an `init` function.



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

  ██████╗ ██████╗ ██████╗ ███████╗   ██╗ ██████╗
 ██╔════╝██╔═══██╗██╔══██╗██╔════╝   ██║██╔═══██╗
 ██║     ██║   ██║██████╔╝█████╗     ██║██║   ██║
 ██║     ██║   ██║██╔══██╗██╔══╝     ██║██║   ██║
 ╚██████╗╚██████╔╝██║  ██║███████╗██╗██║╚██████╔╝
  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚═╝ ╚═════╝

           Name: ${app.name}
        Version: ${package.version}
    Environment: ${app.environment}
----------------------------------------    v${package.version}    ------------
------------------------------------------------------------------
[39m
```

And it would render like this:
```
------------------------------------------------------------------
------------------------------------------------------------------

  ██████╗ ██████╗ ██████╗ ███████╗   ██╗ ██████╗
 ██╔════╝██╔═══██╗██╔══██╗██╔════╝   ██║██╔═══██╗
 ██║     ██║   ██║██████╔╝█████╗     ██║██║   ██║
 ██║     ██║   ██║██╔══██╗██╔══╝     ██║██║   ██║
 ╚██████╗╚██████╔╝██║  ██║███████╗██╗██║╚██████╔╝
  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚═╝ ╚═════╝

           Name: App Kernel
        Version: 1.0.0
    Environment: development
----------------------------------------    v1.0.0    ------------
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
        console.log('TODO: We should really think of a better example!');
    };
});
```

#### REPL Configuration Options

* enabled: Boolean Default true.

You can disable the REPL by setting the `enabled` property to `false`.

##### Banner
You can customize the banner that is displayed in the console output during initialization of your application. Mostly it's about aesthetics but you can use it to display some useful information regarding the connection.

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║                      poke-repl remote console √                    ║
║                                                                    ║
║              All connections are monitored and recorded            ║
║      Disconnect IMMEDIATELY if you are not an authorized user      ║
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




https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/

<!-- LINKS -->

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
[wiki-hmvc]:https://en.wikipedia.org/wiki/Hierarchical_model%E2%80%93view%E2%80%93controller
[wiki-command-pattern]:https://en.wikipedia.org/wiki/Command_pattern
[wiki-front]:https://en.wikipedia.org/wiki/Front_controller
