'use strict';

const Application = require('..').Application;

/*
 * We want to load a subset of the
 * total application.
 * - Ignore some core modules.
 * - Ignore most modules, load pubusb only.
 */
const config = Application.loadConfig({
    coremodules: ['./logger'],
    globOptions: {
        matchPatterh: '+(app.js|pubsub.js)',
        ignorePattern: 'index.js'
    },
    loadModulesOptions: ['pubsub']
}, true);

const app = new Application({config});

app.once('run.complete', function(e) {
    app.logger.debug('>> run.complete: ');
    app.logger.debug('some info %s', Object.keys(app.config));
});

app.once('coreplugins.ready', ()=>{
    app.run();
});
