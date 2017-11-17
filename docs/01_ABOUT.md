# About core.io

**core.io** provides a structure to quickly prototype Node.js applications by providing an eco-system of packages alongside a set of guidelines and conventions to ease development and prototyping.

In a way **core.io** aims to be a workflow rather than a framework by providing a common application structure regardless if your project is web, desktop, terminal, or data focused.

**core.io** provides basic building blocks which are useful in any context and help with common tasks like configuration management, logging, dependency management and basic needs of most applications.

The heart of **core.io** is the [application context](#application-core), which loads and manages a set of core modules and which you can extend directly with custom logic or indirectly with custom modules or community modules.

In a sense, the application context is the kernel around which your application will grow with custom features.

Modules are intended to encapsulate code and make it portable. They also serve as glue to integrate libraries like Socket.IO or AMQP into your project.

Following simple conventions on how files should be named and where those files should be placed **core.io** will auto-load, auto-configure, and auto-wire components while leaving to the developer the choice of overriding default behaviors. Developers can also create custom modules to replace functionality provided by core modules.

1. [Getting Started](#getting-started)
2. [Reference](#reference)
3. [Concepts](#concepts)
4. [Project Structure](#project-structure)

## Getting Started

In order to develop **core.io** applications you will need to have Node.js and npm installed. You can follow instructions in the [Node.js][node] website to download and install these dependencies on your computer.

Make sure to go through the [getting started guide][#getting-started] to get a sense of what you can do with **core.io**.

## Modules

The heart of **core.io** is the [application context](#application-core), which loads and manages a set of core modules and which you can extend directly with custom logic or indirectly with custom modules or community modules.

Modules are intended to encapsulate code and make it portable. They also serve as glue to integrate libraries like Socket.IO or AMQP into your project.

Many of the bundled modules are available to be used outside of **core.io**. Some of them might have up to date documentation and examples:

* [poke-repl][poke-repl]
* [simple-config-loader][simple-config-loader]
* [waterline-crud][waterline-crud]
* [waterline-to-json-schema][waterline-to-json-schema]

You can find and search for modre modules in the [modules page][modules-page].

## Resources

You can look for inspiration in the following open-source applications that make use of **core.io**:

* [Registry Service][core.io-registry-service]


<!--
## F.A.Q.
-->


[poke-repl]:https://github.com/goliatone/poke-repl
[simple-config-loader]:https://github.com/goliatone/simple-config-loader
[waterline-crud]:https://github.com/goliatone/waterline-crud
[waterline-to-json-schema]:https://github.com/goliatone/waterline-to-json-schema
[modules-page]:https://node-core.io/modules
[core.io-registry-service]:https://node-core.io/core.io-registry-service
