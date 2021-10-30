'use strict';
const test = require('tape');
const noopc = require('noop-console');
const sinon = require('sinon');
// const proxyquire =  require('proxyquire');

const Application = require('..').Application;
// Application.DEFAULTS.autoinitialize = false;

test('Application should expose DEFAULTS', (t) => {
    t.ok(Application.DEFAULTS, 'Application.DEFAULTS is defined');
    t.end();
});

test('Application instances extend Application.DEFAULTS', (t) => {
    let app = new Application();

    Object.keys(Application.DEFAULTS).map((key) => {
        t.ok(app[key] !== undefined, 'match ' + key);
    });
    t.end();
});

test.skip('provide should throw in strict mode if we override', (t) => {
    let app = new Application({});
    app.provide('test', 1);
    app.provide('test', 2);
    t.pass('ok');
    t.end();
});

test('Init gets executed only once after calling all initializers', (t) => {
    let count = 0;
    let NOOP = function() { count++; };

    let app = new Application({
        _registerListeners: NOOP,
        _configure: NOOP,
        _setupLongStackTraces: NOOP,
        _showBanner: NOOP,
        _mount: NOOP
    });

    app.init();
    t.equals(count, 5);
    t.end();
});

test('We can configure banner using the "banner" conf property', (t) => {

    const NOOP = function() {};

    const bannerOut = function(banner) {
        t.equals(banner, 'test', 'should be called with expected text');
        t.end();
    };

    let app = new Application({
        banner: 'test',
        bannerOut,
        _registerListeners: NOOP,
        _configure: NOOP,
        _setupLongStackTraces: NOOP,
        // _showBanner: NOOP,
        _mount: NOOP
    });
});

test('Banner is not outputed during production', (t) => {
    let NOOP = function() {};

    let log = sinon.spy(console, 'log');

    let app = new Application({
        banner: 'test',
        environment: 'production',
        _registerListeners: NOOP,
        _configure: NOOP,
        _setupLongStackTraces: NOOP,
        _mount: NOOP
    });

    log.restore();
    t.equals(log.callCount, 0, 'should not be called');
    t.end();
});

test('_showBanner should not be called by default', (t) => {
    let NOOP = function() {};
    var log = sinon.spy(console, 'log');

    let app = new Application({
        _registerListeners: NOOP,
        _configure: NOOP,
        _setupLongStackTraces: NOOP,
        _mount: NOOP
    });

    log.restore();
    t.equals(log.callCount, 0, 'should not be called');
    t.end();
});

test('Banner can be a function, called with app instance and config object', (t) => {
    let NOOP = function() {};
    let banner = sinon.spy();

    let app = new Application({
        banner: banner,
        _registerListeners: NOOP,
        _configure: NOOP,
        _setupLongStackTraces: NOOP,
        _mount: NOOP
    });

    t.equals(banner.callCount, 1, 'should be called once');
    t.equals(banner.firstCall.args[0], app, 'should take app instance as first arg');
    t.equals(banner.firstCall.args[1], app.config, 'should take app config as second arg');
    t.end();
});

test('_configure should extend the application instance with config.app', (t) => {
    let NOOP = function() {};
    let expected = { name: 'TestApp', testing: true };

    let app = new Application({
        _registerListeners: NOOP,
        _showBanner: NOOP,
        _setupLongStackTraces: NOOP,
        _mount: NOOP,
        config: {
            app: expected
        }
    });

    t.equals(app.name, expected.name, 'should receive the name prop');
    t.equals(app.testing, expected.testing, 'should take new properties');
    t.end();
});

test('_configure should wrap "config" in KeyPath utility', (t) => {
    let NOOP = function() {};
    let expected = { name: 'TestApp', testing: true };

    let app = new Application({
        _registerListeners: NOOP,
        _showBanner: NOOP,
        _setupLongStackTraces: NOOP,
        _mount: NOOP,
        config: {
            app: expected
        }
    });

    t.ok(app.config.get, 'config should have a get function');
    t.ok(app.config.set, 'config should have a set function');
    t.ok(app.config.has, 'config should have a has function');
    t.end();
});

test('_setupLongStackTraces should have no effects in production', (t) => {
    let NOOP = function() {};

    let app = new Application({
        environment: 'production',
        _registerListeners: NOOP,
        _configure: NOOP,
        _showBanner: NOOP,
        _mount: NOOP
    });

    t.equals(app._setupLongStackTraces(), false, 'should return false');
    t.end();
});

test('_setupLongStackTraces should have effects outside production', (t) => {
    let NOOP = function() {};

    let app = new Application({
        _registerListeners: NOOP,
        _configure: NOOP,
        _showBanner: NOOP,
        _mount: NOOP
    });

    t.equals(app._setupLongStackTraces(), undefined, 'should return undefined');
    t.end();
});

test('onceRegistered will call the handler immediately if the module is registered', (t) => {
    let NOOP = function() {};
    let handler = sinon.spy();

    let app = new Application({
        _registerListeners: NOOP,
        _setupLongStackTraces: NOOP,
        _configure: NOOP,
        _showBanner: NOOP,
        _mount: NOOP
    });
    app._modules['test'] = {};
    app.onceRegistered('test', handler);
    t.equals(handler.callCount, 1, 'should be called once');
    t.end();
});

test('onceRegistered will call the handler once the module is registered', (t) => {
    let NOOP = function() {};

    let app = new Application({
        _registerListeners: NOOP,
        _setupLongStackTraces: NOOP,
        _configure: NOOP,
        _showBanner: NOOP,
        _mount: NOOP
    });

    app.onceRegistered('test', () => {
        t.pass('should be called once');
        t.end();
    });

    app.emit('test.' + app.registerReadyEvent);

});

test.skip('onErrorHandler will not exit if the Error is not critical', (t) => {
    let NOOP = function() {};

    let app = new Application({
        _registerListeners: NOOP,
        _setupLongStackTraces: NOOP,
        _configure: NOOP,
        _showBanner: NOOP,
        _mount: NOOP
    });

    t.end();
});

test('handleModuleError should throw an error', (t) => {
    let NOOP = function() {};
    let logger = noopc({});

    let app = new Application({
        _logger: logger,
        _registerListeners: NOOP,
        _setupLongStackTraces: NOOP,
        _configure: NOOP,
        _showBanner: NOOP,
        _mount: NOOP
    });

    t.throws(_ => {
        app.handleModuleError('test', new Error('test'));
    }, 'Error thrown');

    t.end();
});

test('handleModuleError should not throw an error it it was handled by the module', (t) => {
    let NOOP = function() {};
    let logger = noopc({});

    let app = new Application({
        _logger: logger,
        _registerListeners: NOOP,
        _setupLongStackTraces: NOOP,
        _configure: NOOP,
        _showBanner: NOOP,
        _mount: NOOP
    });

    t.doesNotThrow(_ => {
        let error = {};
        error.handledByModule = true;
        t.notOk(app.handleModuleError('test', error), 'Modules can handle error and not crash app');
    });

    t.end();
});