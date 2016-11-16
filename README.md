# Application Core

Application core source code.

## Getting Started
Install the module with: `npm install application-core`

## Documentation

### Modules
Modules follow a simple convention, they should export an init function that takes two arguments, an instance of `app-core` and a configuration object.
Your module does not need to return anything, but if it does it should be either an object or a Promise.
If you return an object, you then will be able to access it through the application instance- `app[moduleName]`.
If you return a `Promise` instance, then once it resolves the process is the same.

Once the module is registered, the app instance will emit an event: `moduleName + '.' + config.app.registerReadyEvent`, in the case for the core logger module and using the default value for `registerReadyEvent` the event type would be `logger.registered`.

Once all core plugins are loaded, the application emits the event `coreplugins.ready`.

The modules instantiation follows a simple registration process.

* `module`:
```js
module.exports.init = function(app, config){

};
```


## Examples
See examples dir.

## License
Copyright (c) 2016 goliatone  
Licensed under the MIT license.
