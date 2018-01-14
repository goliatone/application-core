---
title: "Commands"
date: "2017-12-20"
template: "index"
---

## Commands

Set unique signature:

```js
function execute(event){}
event = {
    type: 'event.type',
    payload: {},
    complete: function(){}
}
```

Module properties:

* `execute`: main function
* `undo`: provide undo
* `eventSample`: For testing purposes
