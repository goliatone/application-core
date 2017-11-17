## Reference

### Application

#### Application Context

#### Application Lifecycle

### Configuration

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
