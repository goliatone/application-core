'use strict';
const test = require('tape');
const { resolve, join } = require('path');

const Application = require('..').Application;

test('Application should load configuration', t => {
    const config = Application.loadConfig({
        basepath: fixture(),
        projectpath: fixture(),
    }, true);

    t.ok(config, 'Application.loadConfig is able to load our configurations');

    t.ok(config.logger, 'should load logger config');
    t.ok(config.app, 'should load app config');
    t.ok(config.repl, 'should load repl config');
    t.ok(config.pubsub, 'should load pubsub config');
    t.ok(config.environment, 'should have an environment attribute');
    t.ok(config.package, 'should have an package attribute');

    t.end();
});

function fixture(file = '') {
    return resolve(join(__dirname, 'fixtures', file));
}