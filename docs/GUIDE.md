## core.io

**core.io** provides a structure to quickly prototype Node.js applications by providing an eco-system of packages alongside a set of guidelines and conventions to ease development and prototyping.

In a way **core.io** aims to be a workflow rather than a framework by providing a common application structure regardless if your project is a web, desktop, or terminal application.

**core.io** provides basic building blocks which are useful in any context and help with common tasks like configuration and dependency management, logging, and basic needs of most applications.

The heart of **core.io** is the [application context](#application-core), which loads and manages a set of core modules and which you can extend directly with custom logic or indirectly with custom modules or community modules.

In a sense, the application context is the kernel around which your application will grow with custom features.

Modules are intended to encapsulate code and make it portable. They also serve as glue to integrate third party libraries like Waterline, Socket.IO or to add support for AMQP into your project.

Following simple conventions on how files should be named and where those files should be placed **core.io** will auto-load, auto-configure, and auto-wire components while leaving to the developer the choice of overriding default behaviors. Developers can also create custom modules to replace functionality provided by core modules.

1. [Getting Started](#getting-started)
2. [Reference](#reference)
3. [Concepts](#concepts)
4. [Project Structure](#project-structure)



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

Generally speaking, properties in the `DEFAULTS` object are intended to provide sane defaults but explicitly show what things are expected to be overridden by the developer.

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

### Application Context

During the initialization phase of modules **core.io** will call the module's exported `init` method with two arguments. The first argument is an instance of your application, this instance is called the application context and the convention through the source code, examples, and documentation is to name the argument `context`.

**core.io** intends to keep the global namespace unpolluted so modules should not have strong dependencies on **core.io** beyond the `init` function.

This context acts a little bit like an [IOC][ioc] container in that it is intended to make your code modular and provide a point to extend your application at runtime at the same time that it provides access to features added by other modules.

You will use this `context` to `resolve` dependencies at runtime, and to `provide` new capabilities to your application.

An example of this would be the following hypothetical module:

```js
module.exports.init = function(context, config) {
    const crud = new Crud(config);

    return context.resolve('persistence', 'server').then(() => {
        context.provide('crud', crud.initialize(context.server));
    }).catch(context.handleModuleError.bind(true));
};
```

This module declares two dependencies; `persistence`, and `server`. Modules are  resolved asynchronously so the `then` code will be executed after both `persistence`, and `server` are available.

`context.provide` will expose a `crud` property and make it available to other parts of your code.

**NOTE**: Instead of the `"crud"` string we recommend you use `moduleId` which is part of the `config` object. You will learn later how to configure a module, but for now, know that if the configuration you provide does not include a `moduleId` property, then **core.io** will use the default name of the module.

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

**core.io** does not pollute the `global` namespace, the intended way to access the functionality is by keeping a reference of the `context` object if it's necessary.

### Dependencies
If your module has dependencies most of the time **core.io** can handle those.
It can wait for dependencies

#### Promises

### Extending context

The **core.io** application context exposes a function to provide new functionality through modules.

```js
context.provide(name, capability);
```





### Modules

* alias: if a module exports an alias property, it will be used to register the module instead of the default given name.


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
