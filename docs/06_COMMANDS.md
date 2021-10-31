---
title: "Commands"
date: "2019-07-03"
template: "index"
---

## Commands

Commands are meant to encapsulate your business logic in a tightly bounded scope and executed by triggering an event. Commands are placed in the `./commands` directory of your project and are autoloaded during the application boot sequence. To trigger a command you emit an event using the **core.io** context, if the event type matches a file name then the handler exposed by it's module will be executed.

### Handler

Commands are exposed as modules, so each command is mapped to a file. The module can expose the command as a function or as a class.

Command handlers can be either sync that return a promise  or `async` functions. 

Command exposed as a function :

* `./commands/greet.js`:

```js
module.exports = function greetCommand(event) {
    const context = event.context;
    const logger = context.getLogger('greet-cmd');
    logger.info('Executing greet command');

    return {
        message: `Hello ${event.name}!`
    };
};
```

Command exposed as a class:

* `./commands/greet.js`:

```js
class GreetCommand {
    execute(event) {
        const context = event.context;
        const logger = context.getLogger('greet-cmd');
        logger.info('Executing greet command');
    
        return {
            message: `Hello ${event.name}!`
        };
    }
}

module.exports = HelloCommand;
```

To dispatch this command:

```js
context.emit('hello', {name: 'Peperone'});
```

### Event

The event object will with populated with a set of properties if not present:

* `event.id`: A unique id
* `event.type`: A string with the event type used to trigger the event.
* `event.context`: A reference to the applications **core.io** instance.

By convention **core.io** modules use the following arguments:

* `event.parameters`: Object with any necessary **input data** for the execution of the command.
* `event.meta`: Object with data that would **modify how** a command runs.


### Responses

If the executed command returns any value it will either emit an event with type `${eventType}.done` or if a `respondTo` function is present it will be invoked with a response event.

The event has the following attributes:

* `id`: Event id
* `type`: Event type
* `response`: Output from executing the command. If the returned output is a Promise it will be the resolved value.

Note that the response will be passed as is. One convention followed by different **core.io** modules is to return an object with `body` and `meta` attributes.



#### Event

If we are using events to hook into a command execution completion we can subscribe to the **response** and **error** events.

To handle a response using an event listener:

```js
context.once('hello.done', res => {
    console.info('message: %s', res.message);
});

context.once('hello.error', res => {
    console.error('message: %s', res.message);
});

context.emit('hello', {
    name: 'Peperone',
    respondTo(res, error) {
        console.info('response: %s', res.message);
    }
});
```


#### Respond To

If an event that triggers a command contains a `respondTo` field will use the field to automatically notify on command completion if the command execute handler returns a _truthy_ value.

The `respondTo` callback takes two arguments, a `res` object that will be whatever the command returned during execution. It also takes an `error` object. If the command handler throws an error then the `res` argument is `undefined` and the `error` argument is set to the error thrown. Otherwise it will be `undefined`.

To dispatch this command:

```js
context.emit('hello', {
    name: 'Peperone',
    respondTo: function(res, error) {
        console.log('message: %s', res.message);
    }
});
```