
## Getting Started

In order to develop **core.io** applications you will need to have Node.js and npm installed. You can follow instructions in the [Node.js][node] website to download and install these dependencies on your computer.

**core.io** is compromised of multiple modules each distributed as a Node.js package through [npm][npm] or other package managers.

The fastest way to get up and running is by installing and using the [core CLI tool][core.io-cli] which enables you to create new projects using the command line. You can read more about the **core.io** CLI tool in it's [documentation][core.io-cli-docs] page.

### 1. Install core.io cli tool belt:

Open a new terminal window and type the following command:

```
$ npm i -g core.io-cli
```

This will install **core.io-cli** and make the **core**  command available in your terminal. To verify it was installed correctly, if you type `core` in your terminal you should see a help output.

```
$ core

core 0.0.3 - core.io CLI toolbelt manager

USAGE

  core <command> [options]

COMMANDS

  shuttle install                          Install all dependencies. Needs sudo
  shuttle list                             List all local domains
  shuttle open <domain>                    Open domain in default browser
  shuttle share <project>                  Generate a shareable URL for a project
  shuttle restart                          Restart Caddy and Dnsmasq services
  shuttle stop                             Stop Caddy and Dnsmasq services
  shuttle start                            Start Caddy and Dnsmasq services
  shuttle serve <domain> <proxy>           Proxy a local domain and save it for quick access
  shuttle update                           Update toolchain
  generator add <source> [alias]           Add a project template from github or a local directory
  generator list                           List available templates
  generator new <template> [output]        Create a new project from a project template
  generator link <source> [alias]          Link local template for development
  schema collect [source] [output]         Collect metadata from waterline models and generates a JSON schema file
  schema generate [source] [output]        Generate schema from model data
  scaffold compile [source] [output]       Generate views from a GUI schema
  scaffold generate [source] [output]      Generate views from a JSON schema
  run [application] [environment]          Run a core.io application
  repl                                     Open REPL window
  help <command>                           Display help for a specific command

GLOBAL OPTIONS

  -h, --help         Display help
  -V, --version      Display version
  --no-color         Disable colors
  --quiet            Quiet mode - only displays warn and error messages
  -v, --verbose      Verbose mode - will also output debug messages
```

If everything works as expected continue with step 2. Otherwise you could create an issue on [github][issues].

### 2. Create a project

Once you have the tool belt installed, you can create a project from your terminal.

```
$ core generator new myProject 
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


## What to do next?

* [Documentation](/documentation)
* [Examples](/examples)
* [Plugins](/plugins)

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
