### Modules

A module adds a specific feature to an existing application context, providing a means to extend your application with specific behavior for a given project in an encapsulated way.

All modules are stored in the **modules** folder of your application project directory.

 thus maximizing the amount of code you can reuse between applications.

Modules follow a simple convention: they should export an init function that take an instance of the application `context` and a configuration object as arguments.

Modules should have a name that is unique in your application. This name will be used to access the module later on from other parts of your application.
By default the module loader will infer this name from the file that registers the module.

Your module does not need to return anything, but if it does it should be either an object or a Promise.

If you return an object, you then will be able to access it through the application instance- `app[moduleName]`.

If you return a `Promise` instance, then once it resolves the process is the same.

Once the module is registered, the app instance will emit an event: `moduleName + '.' + config.app.registerReadyEvent`, in the case for the core logger module and using the default value for `registerReadyEvent` the event type would be `logger.registered`.

Once all core plugins are loaded, the application emits the event `coreplugins.registered`.

#### Module autoloading


#### Module instantiation

The modules instantiation follows a simple registration process.

* users module:

**./modules/users.js**
```js
module.exports.init = function(core, config) {
    ...
    return users;
};
```


```js
core.once('users.registered', function() {

});
```
