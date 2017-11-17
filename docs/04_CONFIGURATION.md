### Configuration

While the intention of **core.io** is to adhere to the idea of convention over configuration, it still grants you, the developer, full control over most aspects of _your_ application by letting you override default values.

**core.io** configuration process is purportedly simple, a **core.io** application takes an options object with configuration parameters and override values. **core.io** does not really care how you come up with that object.

However, the `Application` class provides a helper static method to collect, merge, and resolve dependencies of configuration files that are located in the `./config` folder of a project.

The resulting configuration object will be made available at runtime on the application context as `context.config`.

When you create a new `Application` instance you can pass an `options` object to it's constructor.

This `options` object has two purposes. If you define a `configuration` key, it's value will be added to `context.config`.

All other keys in this object will extend the application instance, like a [mixin][mixin]. The application instance extends itself with this object in it's `init` method which is called directly from the constructor.

You can use it to override methods before the instance makes use of any of them or to add new methods to your instance.

```javascript
const App = require('core.io').Application;

/*
 * Autoload and merge files inside
 * `config/` directory.
 */
const config = App.loadConfig({
    //...default values
}, true);

const app = new App({
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
/*
 * Get the value of "environment" defined in config/app.js
 * return "production" if undefined.
 */
let environment = context.config.get('app.environment', 'production');
```

It's more useful when you need to access a deeply nested object:

```js
//Get the value of "repl.options.prompt", return "poke-repl >" if undefined.
let prompt = context.config.get('repl.options.prompt', 'poke-repl >');
```

#### Module configuration

When **core.io** registers a module, first it will `require` the module and then will look for a key in `context.config` that matches the module's [moduleid](#modules-names). It will then call `module.init` with a reference to the value of this key.

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

#### Supporting Different Environments

Another aspect in which **core.io** tries to simplify the configuration process is by _how_ it supports different development environments, like **staging**, **development**, **production**, etc.

In short: _it does not_.

To be more precise, **core.io** takes a very pragmatic stance and does not provide any way to (directly) manage different environments but has some _recommendations_ that make having configuration files per environment unnecessary.

A lot of the things that need to change on each environment are _secrets_ like service tokens or user keys. We chose to manage those by using `process.env` and environment variables.

If you use the provided `Application.loadConfig` then your configuration files are javascript files which, obviously, can have logic in it. Meaning that you can check the value of `process.env.NODE_ENV` and export different objects based on that value.

Another benefit of `Application.loadConfig` is that you can reference other parts of your configuration files and solve them at runtime, making your configuration files modular.

You can also make use of the `afterSolver` facility which gets access to the merged configuration object. In it you can access the `environment` key which holds the value of the current environment and modify your configuration file at runtime.

Case in point, you have options.

Ideally your configuration files should be logic lightweight in order to reduce possible errors and keep things simple, but you are free to do as you please.

You can also use an environment manager like [envset][envset] to dynamically populate your `process.env` variables. All you need is an `.envset` file where you define your environments, environment variables and their values:

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


**NOTE**: If you use `.envset` remember to add it to your `.gitignore` file.

Lastly but more importantly, you can **BYOS**- bring your own solution- and use whatever configuration system you prefer.

Configuration files located in the [`config/`](#configuration-loader) folder of projects will be merged together in a single object, which will be available at runtime as a property of your application instance, i.e. `context.config`.

The top-level keys on the `context.config` (i.e. `context.config.repl`) object correspond to a particular configuration file name under your `config/` directory (i.e. `config/repl.js`). Most individual configuration files are specific to a module, **with the exception of `config/app.js`**  which should hold options for the current application, like the application's name, it's base directory, environment in run under, etc.

The intention of these files is to provide modules with configuration options. When a module is loaded, it will be called with the application's instance and a `config` top-level key that matches the module's name.


### Configuration dependencies

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

#### Module configuration

When **core.io** registers a module, first it will `require` the module and then will look for a key in `context.config` that matches the module's [moduleid](#modules-names). It will then call `module.init` with a reference to the value of this key.

Pseudo code to illustrate:

```js
let moduleId = 'persistence';
let config = this.config.get(moduleId, {});
module.init(this, config);
```

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
