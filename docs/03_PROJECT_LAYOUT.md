---
title: "Project Layout"
date: "2017-12-20"
template: "index"
---

# Project Structure

In this guide we learn how **core.io** applications are structured and the conventions around the different file loaders used to bootstrap your applications.

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:0 orderedList:0 -->

- [Project Structure](#project-structure)
    - [Project Layout](#project-layout)
    - [Basic Layout](#basic-layout)
        - [The config directory](#the-config-directory)
        - [The modules directory](#the-modules-directory)
        - [The commands directory](#the-commands-directory)
<!-- /TOC -->

## Project Structure

One of the main goals of **core.io** is to provide a consistent way to structure your projects. **core.io** organizes your code by placing them under predetermined directories that will group files with a similar role.

That is to say, all modules will live under a **modules** directory, all configuration files under a **config** directory, etc.

If you use the [core cli tool][core.io-cli] the default generator template will create three directories; config, modules, and commands. It will also create an **index.js** file, a **package.json** file, and a `taskfile` file.

`package.json` is a standard **Node.js** file with no special properties.

`taskfile` is a bash file that follows [the Taskfile specification][taskfile] and is used to provide simple tasks. It's provided as a convenience, some projects might warrant a more sophisticated- and complex!- task runner or bundler.

`index.js` is the application entry point, i.e. you could start your application by calling `node index.js`.

You can extend your main `Application` instance here, however it's recommended that you do so by leveraging modules instead.

### Project Layout

**core.io** will [autoload][guide-autoload] files found in different directories, and depending on which directory, process them in different ways, and make them available to your application in different ways as well.

### Basic Layout

```mark
.
├── config
|    ├── app.banner.txt
|    └── app.js
|
├── modules
|
├── commands
|    └── run.post.js
|
├── package.json
└── index.js
```

| File/Directory        | Description                                                                                                                                                                                            |
|-----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| index.js              | By default this is the entry point to your application.                                                                                                                                                |
| package.json          | Standard Node.js pacakges file.                                                                                                                                                                        |
| config                | The config directory is used to store configuration files. All files found in this directory will be auto loaded and made available through the config object, using the file name as a property name. |
| config/app.banner.txt | Application ASCII banner. Will be shown in the console output when running in debug mode.                                                                                                              |
| config/app.js         | This configuration file holds properties of the main application module.                                                                                                                               |
| modules               | The modules directory holds all modules specific to this application. All files found in this directory will be auto loaded and potentially made available to the application context object.          |
| commands              | The commands directory holds all commands specific to this applications. Commands can be triggered by dispatching an event which type matches the file name of the command.                            |


#### The config directory

Configuration files located in the [`config/`](#configuration-loader) folder of your project directory will be required and the exported object of each file merged together in a single object, which will be available at runtime as a property of the application context, e.g. `context.config`.

The application context will expose a configuration object per file loaded, you can then query the `context.config` object for specific values.

As an example, imagine we have the file `config/server.js` with the following contents:

```js
module.exports = {
    port: 9090
};
```

The content will be available in the following path:

```js
context.config.server.port
```

The `config` object provides a `get` and a `set` methods as a convenience.

```js
context.config.get('server.port');
```

The `get` method enables you to provide a default value for properties that were not defined in the file itself:

```js
context.config.get('server.debug', false);
```

You can read more about **core.io** configuration files in the [configuration guide][config-guide].

#### The modules directory

All valid modules found in the `modules` directory will be required and then registered with the application context.

A valid module is either a javascript file exporting an `init` function or a directory with an **index.js** file exporting an `init` function.

A basic `hello-world.js` module would look like this:

```js
module.exports.init = function(context, config) {

    const greeter = {
        sayHello: function(msg){
            context.logger.info('Module greeter says: %s', msg);
        }
    };

    context.provide('greeter', greeter);
};
```

You can read more about **core.io** modules in the [modules guide][modules-guide].

#### The commands directory

#### Application entrypoint

The entry point file is named `index.js` by default/convention, but basically you can use anything that would work in a `npm start` script.

[config-guide]:#config-guide
[guide-autoload]:#guide-autoload
[modules-guide]:#modules-guide
