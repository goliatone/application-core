---
title: "Reference"
date: "2017-12-20"
template: "index"
---

## Reference

### Application

#### Application Context

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

#### Application Lifecycle

### Configuration

While the intention of **core.io** is to adhere to the idea of convention over configuration, it still grants you, the developer, full control over most aspects of _your_ application by letting you override default values.

**core.io** configuration process is purportedly simple, a **core.io** application takes an options object with configuration parameters and overrides. **core.io** does not really care how you come up with that object.

However, the `Application` class provides a helper static method to collect, merge, and resolve dependencies of configuration files that are located in the `./config` folder of a project.

The resulting configuration object will be made available at runtime on the application context as `context.config`.

When you create a new `Application` instance you can pass an `options` object to it's constructor.

This `options` object has two purposes. If you define a configuration key, it's value will be added to `context.config`.

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

For convenience **core.io** wraps the `config` object with a `get` and `set` methods.

This is so that you can access a deep object without fear of some object in the path not being defined. It also enables you to provide a default value for such cases.

```js
//Get the value of "environment" defined in config/app.js
//return "production" if undefined.
let environment = context.config.get('app.environment', 'production');
```

It's more useful when you need to access a deeply nested object:

```js
//Get the value of "repl.options.prompt", return "poke-repl >" if undefined.
let prompt = context.config.get('repl.options.prompt', 'poke-repl >');
```

#### Module Configuration

When **core.io** registers a module, first it will `require` the module and then will look for a key in `context.config` that matches the module's [moduleId](#modules-names). It will then call `module.init` with a reference to the value of this key.

Pseudo code to illustrate:

```js
let moduleId = 'persistence';
let config = this.config.get(moduleId, {});
module.init(this, config);
```

#### Configuration Files

`Application.loadConfig` will load all configuration files found inside the `./config` directory of your application.

It will then load the files, and merge them in a single object using the file name as a key.

If you have a configuration file that has the same name as a given module's `moduleId` then the contents of that file will be passed to the module during the initialization phase.

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

There is also the possibility of processing the contents of a configuration file **after** it has been merged and loaded.

If you export a function named `afterSolver` it will be called after all dependencies have been resolved. The function will be called with the whole configuration object.

```js
module.exports.afterSolver = function(config) {
    config.set('amqp.amqp', require('amqp'));
};
```

Configuration files are regular JavaScript files, which means you can build different logic into them.

Under the hood **core.io** uses the [simple config loader][scl] package. You can read more in the packages repository.

**core.io** provides a convenience method to collect these configuration files.

```javascript
var App = require('core.io').Application;

/*
 * Autoload and merge files inside
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

You can specify the path from where to look for the configuration files.

### Modules

#### Core Modules

#### Extended Modules

### Commands

### Autoloading

Autoloading refers to a **core.io** feature which take files placed in specific directories within your project then _load_ and _wire_ the files into your project, or application context to be more precise.

As an example, all files under `./config` can be autoloaded if you use the `Application.loadConfig` static method.

All files under the `./commands` directory will be `require`d and registered as commands.

If you are using the [persistence][core-persistence] module, then all files under the `./models` directory will be registered as models.

But mainly, all valid modules found in the `./modules` directory will be loaded and registered with the application context, meaning that to add a new module to your application you simply need to place it in the `./modules` directory and then **core.io** will do the rest.

Note that the dependency solving cycle happens statically at runtime during the boot process of your application, so to detect a new module you need to stop and restart your application.

#### Module Loader

As explained earlier, all valid modules found in the `modules` directory will be required and then registered with the application context.

A valid module is either a javascript file exporting an `init` function or a directory with an **index.js** file exporting an `init` function.

#### Commands Loader

#### Configuration Loader

#### Model Loader
