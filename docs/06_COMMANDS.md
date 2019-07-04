---
title: "Commands"
date: "2019-07-03"
template: "index"
---

## Commands

Commands are meant to encapsulate your business logic in a tightly bounded scope and executed by triggering an event. Commands are placed in the `./commands` directory of your project and are autoloaded during the application boot sequence. To trigger a command you emit an event using the **core.io** context, if the event type matches a file name then the handler exposed by it's module will be executed.

### Handler

Commands are exposed as modules, so each command is mapped to a file. The module can expose the command as a function or as a class.

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


#### Responses

If the executed command returns any value it will either emit an event with type `${eventType}.done` or if a `respondTo` function is present it will be invoked.

##### Event

To handle a response using an event listener:

```js
context.once('hello.done', resp => {
    console.log('message: %s', resp.message);
});

context.emit('hello', {
    name: 'Peperone',
    respondTo(resp) {
        console.log('message: %s', resp.message);
    }
});
```

##### Respond To

If an event that triggers a command contains a `respondTo` field will use the field to automatically notify on command completion if the command execute handler returns a truthy value.


To dispatch this command:

```js
context.emit('hello', {
    name: 'Peperone',
    respondTo: function(resp){
        console.log('message: %s', resp.message);
    }
});
```