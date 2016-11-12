/*jshint esversion:6, node:true*/
'use strict';

module.exports = {
    dirname: '.',
    filenamePrefix: '${app.name}'
};

module.exports.afterSolver = require('../../lib/logger').afterSolver;
