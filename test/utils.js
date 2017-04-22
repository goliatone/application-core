'use strict';
const test = require('tape');

const utils = require('../lib/utils');
const sanitizeName = utils.sanitizeName;
const getModuleName = utils.getModuleName;
const getPathToMain = utils.getPathToMain;

// Application.DEFAULTS.autoinitialize = false;

test('sanitizeName should camel case strings', (t) => {
    t.equals(sanitizeName('data-manager'), 'dataManager', 'String sanitized.');
    t.end();
});

test('sanitizeName should remove initial digits from name', (t) => {
    t.equals(sanitizeName('01.first-command'), 'firstCommand', 'String sanitized.');
    t.end();
});

test('getModuleName given a path should return the name of a file', (t)=>{
    t.equals(getModuleName('/path/to/filename.js'), 'filename', 'Correct filename');
    t.end();
});

test('getPathToMain should return the path to main process file', (t)=>{
    t.ok(getPathToMain(), getPathToMain());
    t.end();
});
