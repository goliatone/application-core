'use strict';
const test = require('tape');

const {
    getUid,
    sanitizeName,
    getModuleName,
    getPathToMain,
} = require('../lib/utils');

// Application.DEFAULTS.autoinitialize = false;

test('sanitizeName should camel case strings', (t) => {
    t.equals(sanitizeName('data-manager'), 'dataManager', 'String sanitized.');
    t.end();
});

test('sanitizeName should remove initial digits from name', (t) => {
    t.equals(sanitizeName('01.first-command'), 'firstCommand', 'String sanitized.');
    t.end();
});

test('getModuleName given a path should return the name of a file', (t) => {
    t.equals(getModuleName('/path/to/filename.js'), 'filename', 'Correct filename');
    t.end();
});

test('getModuleName given a path should return the name of a file', (t) => {
    t.equals(getModuleName(''), '', 'Correct filename');
    t.end();
});

test('getPathToMain should return the path to main process file', (t) => {
    t.ok(getPathToMain(), getPathToMain());
    t.end();
});

test('getUid should return a string of length 20 by default', (t) => {
    const expected = 20;
    t.equals(
        getUid().length,
        expected,
        'default length'
    );

    t.end();
});

test('getUid should return a string of min length 14', (t) => {
    const expected = 14;

    t.equals(
        getUid(1).length,
        expected,
        'default min length'
    );

    t.end();
});

test('getUid should append a prefix which does not count for length', (t) => {
    const prefix = 'test';
    const expected = prefix.length + 1 + 14;

    t.equals(
        getUid(1, prefix).length,
        expected,
        'prefixed uid'
    );

    t.end();
});

test('getUid should accept swapping arguments', (t) => {
    const prefix = 'test';

    t.equals(
        getUid(10, prefix).length,
        getUid(prefix, 10).length,
        'swapping arguments'
    );

    t.end();
});

test('getUid should accept only prefix argument', (t) => {
    const prefix = 'test';
    const expected = prefix.length + 1 + 20;

    t.equals(
        getUid(prefix).length,
        expected,
        'swapping arguments'
    );

    t.end();
});