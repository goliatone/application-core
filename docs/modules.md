### Modules
Modules follow a simple convention: they should export an init function that take an instance of `app-core` and a configuration object as arguments.

Your module does not need to return anything, but if it does it should be either an object or a Promise.

If you return an object, you then will be able to access it through the application instance- `app[moduleName]`.
If you return a `Promise` instance, then once it resolves the process is the same.

Once the module is registered, the app instance will emit an event: `moduleName + '.' + config.app.registerReadyEvent`, in the case for the core logger module and using the default value for `registerReadyEvent` the event type would be `logger.registered`.

Once all core plugins are loaded, the application emits the event `coreplugins.registered`.

The modules instantiation follows a simple registration process.

* users module:

**./modules/users.js**
```js
module.exports.init = function(core, config){
    ...
    return users;
};
```

core.once('users.registered', function(){

});
