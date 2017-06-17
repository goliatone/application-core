
## Getting Started

**core.io** is compromised of multiple modules each distributed as a Node.js package through [npm][npm] or other package managers.

In order to develop **core.io** applications you need to have Node.js and npm installed. You can follow instructions in the [Node.js][node] website to download and install these dependencies on your computer.

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
  core help                             Show this message.
  core --version                        Print out the latest released version of core.
  core install [template]               Download and install a [template] from github.
  core new [project-name]               Create a new project.

Example:
  core new myProject                    Create a new project.

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

### 3. Run project

Last step is to run your project, which could be as simple as opening a terminal window and typing the following command:

```
$ npm start
```

You should see the banner ASCII art followed by the logger output in your terminal.

**TIP:** To manage different environments you can always use [envset][envset]:

```
$ envset development -- npm start
```

<!-- LINKS -->

[core-persistence]:https://github.com/goliatone/core.io-persistence
[core-server]:https://github.com/goliatone/core.io-express-server
[core-data]:https://github.com/goliatone/core.io-data-manager
[core-sync]:https://github.com/goliatone/core.io-filesync
[core-auth]:https://github.com/goliatone/core.io-express-auth
[core-crud]:https://github.com/goliatone/core.io-crud

[envset]:https://github.com/goliatone/envset
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
