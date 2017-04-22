'use strict';
const test = require('tape');

const Application = require('..').Application;
// Application.DEFAULTS.autoinitialize = false;

test('Application should expose DEFAULTS', (t) => {
    t.ok(Application.DEFAULTS, 'Application.DEFAULTS is defined');
    t.end();
});

test('Application instances extend Application.DEFAULTS', (t) =>{
    let app = new Application();

    Object.keys(Application.DEFAULTS).map((key)=>{
        t.ok(app[key] !== undefined, 'match ' + key);
    });
    t.end();
});

test('Application instances extend Application.DEFAULTS', (t) =>{
    let app = new Application();

    
    t.end();
});
