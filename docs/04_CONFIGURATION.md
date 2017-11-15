### Configuration

Configuration files located in the [`config/`](#configuration-loader) folder of projects will be merged together in a single object, which will be available at runtime as a property of your application instance, i.e. `context.config`.

The top-level keys on the `context.config` (i.e. `context.config.repl`) object correspond to a particular configuration file name under your `config/` directory (i.e. `config/repl.js`). Most individual configuration files are specific to a module, **with the exception of `config/app.js`**  which should hold options for the current application, like the application's name, it's base directory, environment in run under, etc.

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
