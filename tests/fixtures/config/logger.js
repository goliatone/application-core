/*jshint esversion:6, node:true*/
'use strict';

module.exports = {
    dirname: '.',
    wrapConsole: true,
    filenamePrefix: '${app.name}',
    silentInProd: false,
};

module.exports.afterSolver = require('../../../lib/logger').afterSolver;