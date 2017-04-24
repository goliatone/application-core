'use strict';
const test = require('tape');

const EventEmitter = require('events');
const Dispatcher = require('../lib/dispatcher');

test('It exposes an init function', (t)=>{
    t.ok(Dispatcher.init, 'expose init');
    t.ok(typeof Dispatcher.init === 'function', 'init should be a function');
    t.end();
});


test('It exposes a chainEvents function', (t)=>{
    t.ok(Dispatcher.chainEvents, 'expose chainEvents');
    t.end();
});

test('Dispatcher.chainEvents should wrap an event emitter', (t)=>{
    let emitter = new EventEmitter();
    emitter.chainEvents = Dispatcher.chainEvents(emitter);
    t.ok(typeof emitter.chainEvents === 'function');
    t.end();
});

test('The wrapped chainEvents should return a Promise like object', (t)=>{
    let emitter = new EventEmitter();
    emitter.chainEvents = Dispatcher.chainEvents(emitter);
    let chain = emitter.chainEvents(['start', 'run', 'end']);
    t.ok(typeof chain.then === 'function');
    t.ok(typeof chain.catch === 'function');
    t.end();
});

test('The returned Promise should be "resolved" once all events are fired', (t)=>{
    let emitter = new EventEmitter();
    emitter.chainEvents = Dispatcher.chainEvents(emitter);

    let chain = emitter.chainEvents(['start', 'run', 'end']);

    emitter.emit('start');
    emitter.emit('run');
    emitter.emit('end');

    chain.then(()=>{
        t.pass('Chain is resolved when all events are fired');
        t.end();
    });

    chain.catch(()=>{
        t.fail('Chain should not be rejected');
        t.end();
    });
});

test('The returned Promise should be "rejected" once any reject events is fired', (t)=>{
    let emitter = new EventEmitter();
    emitter.chainEvents = Dispatcher.chainEvents(emitter);

    let chain = emitter.chainEvents(['start', 'run', 'end'], ['reject', 'error']);

    emitter.emit('start');
    emitter.emit('reject');
    emitter.emit('run');
    emitter.emit('end');

    chain.then(()=>{
        t.fail('Chain should not be resolved when a reject event is fired');
        t.end();
    });

    chain.catch(()=> {
        t.pass('Chain should be rejected');
        t.end();
    });
});

test('The returned "resolved" Promise should get all events', (t)=>{
    let emitter = new EventEmitter();
    emitter.chainEvents = Dispatcher.chainEvents(emitter);

    let chain = emitter.chainEvents(['start', 'run', 'end']);

    let e1 = {type:1};
    let e2 = {type:2};
    let e3 = {type:3};

    emitter.emit('start', e1);
    emitter.emit('run', e2);
    emitter.emit('end', e3);

    chain.spread((r1, r2, r3)=> {
        t.deepEqual(e1, r1);
        t.deepEqual(e2, r2);
        t.deepEqual(e3, r3);
        t.end();
    });

    chain.catch(()=>{
        t.fail('Chain should not be rejected');
        t.end();
    });
});

test('It exposes a createHook function', (t)=>{
    t.ok(Dispatcher.createHook, 'expose createHook');
    t.end();
});

test('Dispatcher.createHook should wrap an event emitter', (t)=>{
    let emitter = new EventEmitter();
    emitter.hook = Dispatcher.createHook(emitter);
    t.ok(typeof emitter.hook === 'function');
    t.end();
});

//TODO: Give it a better caption :)
test('The hook method should trigger hooks', (t)=>{
    let emitter = new EventEmitter();
    emitter.hook = Dispatcher.createHook(emitter);

    emitter.on('run.pre', (e)=>{
        return e;
    });

    emitter.on('run.post', (e)=>{
        return e;
    });

    emitter.on('run', (e)=>{
        return e;
    });

    emitter.on('run.complete', (e)=>{
        t.pass('hook ran complete');
        t.end();
    });

    emitter.hook('run', {});
});

test.skip('The event sent through a hook can be modified', (t)=>{
    let emitter = new EventEmitter();
    emitter.hook = Dispatcher.createHook(emitter);

    emitter.on('run.pre', (e)=> {
        e.pre = true;
    });

    emitter.on('run.post', (e)=> {
        e.post = true;
    });

    emitter.on('run', (e)=>{
        e.run = true;
    });

    emitter.on('run.complete', (e)=> {
        t.deepEqual(e, {pre: true, post: true, run: true}, 'hook ran complete');
        t.end();
    });

    emitter.hook('run', {});
});
