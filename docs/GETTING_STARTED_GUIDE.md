
## Getting Started

**core.io** is compromised of multiple modules each distributed as a Node.js package through [npm][npm] or other package managers.

In order to develop **core.io** applications you need to have Node.js and npm installed. You can follow instructions in the [Node.js][node] website to download and install this dependencies in your computer.

The fastest way to get up and running is by installing and using the [core CLI tool][core.io-cli] which enables you to create new projects using the command line. You can read more about the **core.io** CLI tool in it's [documentation][core.io-cli-docs] page.

### 1. Install core.io cli tool belt:

Open a new terminal window and type the following command:

```
$ npm i -g core.io-cli
```

This will install **core.io-cli** and make the **core**  command available in your terminal. To verify it was installed correctly, if you type `core` in your terminal you should see a help output.

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

### 2. Create a project
Once you have the tool belt installed, you can create a project from your terminal.

```
$ core new myProject
```

The generator will create a new folder for your application in your current directory, set up an empty project and download all the necessary dependencies.

**NOTE**:
By default it will use the [core.io project starter][core.io-starter-template]. You can create and install your custom project templates. Read more in the documentation.

### Structure of a project

One of the main goals of **core.io** is to provide a consistent way to structure your projects. **core.io** organizes your code by placing them under predetermined directories that will group files with a similar role.

That is to say, all modules will live under a **modules** directory, all configuration files under a **config** directory, etc.

By default it will create three directories; config, modules, and commands. It will also create an **index.js** file, a **package.json** file, and a `taskfile` file.

`package.json` is a standard **Node.js** file with no special properties.

`taskfile` is a bash file that follows [the Taskfile specification][taskfile] and is used to provide simple tasks. Is provided as a convenience, some projects might warrant a more sophisticated- and complex!- task runner or bundler.

`index.js` is the application entry point, i.e. you could start your application by calling `node index.js`. You can extend you main `Application` instance here, however is recommended that you do so by leveraging modules instead.

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
|   package.json
└── index.js
```

### Configuration

**core.io** configuration files can be found under the `./config` directory. A configuration file is a JavaScript file that exports an object. All files under the `./config` directory are loaded and all exported objects merged together into a single config object which will be available at runtime as a property of your application instance, i.e. `context.config`.

The current behavior is to use the filename as the top-level key for the object inside the file. The top-level keys on `context.config` (i.e. `context.config.repl`) object correspond to a configuration file's name minus the extension found under the `./config` directory (i.e. `./config/repl.js`).

The file `./config/repl.js` will be available at runtime as the `repl` attribute of the `config` object of your application instance, often referred to as `context`.

Configuration files that have the same name as a module will automatically be made accessible to the module during the [module's instantiation phase][module-instantiation].

The options for your current application will be in a configuration file named `app.js` (`./config/app.js`) which holds options like your application name, the ASCII banner used by the REPL tool, or application wide variables such as environment.

Configuration files are regular JavaScript files, which means you can build different logic into them. Read more about [configuration][config-docs] in the documentation.

### Modules



## API

### Application Core


TODO:
- [ ] Make a list of reserved words



<!-- LINKS -->

[core-persistence]:https://github.com/goliatone/core.io-persistence
[core-server]:https://github.com/goliatone/core.io-express-server
[core-data]:https://github.com/goliatone/core.io-data-manager
[core-sync]:https://github.com/goliatone/core.io-filesync
[core-auth]:https://github.com/goliatone/core.io-express-auth
[core-crud]:https://github.com/goliatone/core.io-crud

[taskfile]:https://github.com/adriancooney/Taskfile
[module-instantiation]:modules.md#module-instantiation
[config-docs]:guide.md

[node]:http://nodejs.org/
[npm]: http://npmjs.com
[core.io-cli]:https://www.npmjs.com/package/core.io-cli
[core.io-cli-docs]:https://github.com/goliatone/core.io-cli/tree/master/docs
[core.io-starter-template]:https://github.com/goliatone/core.io-starter-template
[scl]:https://github.com/goliatone/simple-config-loader
[poke]:https://github.com/goliatone/poke-repl
[noop-console]:https://github.com/goliatone/noop-console
