
## Getting Started

**core.io** is compromised of multiple packages distributed as a Node.js package. You will need to have Node.js and npm installed. You can follow instructions in the [Node.js][node] website.

The fastest way to get up and running is by installing and using the [core CLI tool][core.io-cli].

1. Install core.io cli toolbelt:

Open a new terminal window and type the following command:

```
$ npm i -g core.io-cli
```

This will install **core.io-cli** and make the **core**  command available in your terminal. To verify it was installed correctly, if you type **core** in your terminal you should see a help output.

```
$ core

core.io CLI tool

Usage:
  core help                             Show this message
  core --version                        Print out the latest released version of core
  core install [template]               Download and install a [template] from github.
  core new [project-name]               Create a new project

Example:
  core new myProject                    Create a new project

version:
  1.0.0
```

2. Create a project
Once you have the tool belt installed, you can create a project from your terminal.

```
$ core new myProject
```

The generator will create a new directory for your application, set up an empty project and download all the necessary dependencies.


### Structure of a project

One of the main goals of **core.io** is to provide a consistent way to structure your projects. **core.io** organizes your code by placing them under predetermined directories that describe their role.

By default it will create three directories; config, modules, and commands. It will also create an **index.js** and a **package.json** file.

```mark
.
├── config
|    ├── app.js
|    ├── logger.js
|    ├── repl.js
|    ├── ...
|    └── persistence.js
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
|   package.json
└── index.js
```

### Configuration

**core.io** configuration files can be found under the `./config` directory. A configuration file is a javascript file that exports an object. All files are loaded and all exported objects merged together into a config object which will be available at runtime on as a property of your application instance, i.e. `app.config`.

The current behavior is to use the filename as the top-level key for the object inside the file. The top-level keys on `app.config` (i.e. `app.config.repl`) object correspond to a configuration file's name minus the extension found under the `./config` directory (i.e. `./config/repl.js`).

Configuration files that have the same name as a module will be made accessible to the module during instantiation.
The options for your current application should be in a configuration file named `app.js` (`./config/app.js`) which should hold options like your application name.

Configuration files are regular javascript files, which means you can build different logic into them.

Configuration files can contain references to a value found in other configuration files  using special a simple syntax that will get resolved after merging all files into a single object. Using two different syntax you can reference strings or objects:

* Strings: `${app.name}`
* Objects: `@{app.locals}`

As an example, `${app.name}` will be resolved to `config.app.name`:

* `config/app.js`:

```javascript
module.exports = {
  name: 'MyApplication'
};
```

*  `config/repl.js`:

```javascript
module.exports = {
  prompt: '${app.name}'
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

var app = new App({config});
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


[node]:http://nodejs.org/
[core.io-cli]:https://www.npmjs.com/package/core.io-cli
[scl]:https://github.com/goliatone/simple-config-loader
