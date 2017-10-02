'use strict';

const Application = require('..').Application;

/*
 * We want to load a subset of the
 * total application.
 * - Ignore some core modules.
 * - Ignore most modules.
 */
const config = Application.loadConfig({
    coremodules: ['./logger'],
    globOptions: {
        matchPatterh: '+(app.js|pubsub.js)',
        ignorePattern: 'index.js'
    }
}, true);

console.log(Object.keys(config));
console.log(config.coremodules);
