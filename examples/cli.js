'use strict';

const Application = require('..').Application;

/*
 * We want to load a subset of the
 * total application.
 * - Ignore some core modules.
 * - Ignore most modules, load pubusb only.
 */
const config = Application.loadConfig({
    /*
     * To override application-core specific
     * configuration options we need to wrap
     * them here.
     */
    app: {
        coremodules: ['./logger', './dispatcher'],
        loadModulesOptions: {
            only: ['pubsub']
        }
    },
    /*
     * Available options to override
     * simple-config-loader:
     * - dirname
     * - globOptions
     * - getConfigFiles
     * - getPackage
     * - configsPath
     */
    globOptions: {
        matchPatterh: '+(app.js|pubsub.js)',
        ignorePattern: 'index.js'
    }
}, true);


const app = new Application({config});

app.once('run.post', function(e) {
    app.logger.warn('>> run.complete: ');
    app.logger.warn('some info %s', Object.keys(app.config));
});

app.once('modules.ready', ()=>{
    app.run();
});
