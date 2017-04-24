'use strict';

const path = require('path');
const glob = require('glob');
const extend = require('gextend');

const DEFAULTS = {
    logger: console,
    autoinitialize: true
};

class ModuleLoader {
    constructor(app, config) {
        this.app = app;
        config = extend({}, DEFAULTS, config);
        if(config.autoinitialize) this.init(config);
    }

    init(options){
        extend(this, options);
    }

    /**
     * Collect files in a directory.
     * @param  {String} match   glob pattern
     * @param  {Object} options Options object
     * @return {void}
     */
    collectDirectory(match, options) {
        if(!path.isAbsolute(match)) {
            dir = path.join(getPathToMain(), dir);
        }

        this.logger.info('load directory %s', dir);
        return new Promise(function(resolve, reject){
            glob(dir, options, function(err, files){
                if(err) reject(err);
                else resolve(files);
            });
        });
    }

    /**
     * Require module
     * @param  {String} path Path to module
     * @param  {String} id   Module id
     * @return {Object}
     */
    require(path, id) {
        return require(path).init(this, this.config.get(id, {}));
    }

    loadModule(id, path){
        this.logger.info('- loading module "%s", %s', id, path);

        var instance,
            output = Promise.defer();

        try {
            instance = this.require(path, id);
            output.resolve(instance);
        } catch (e) {
            this.logger.error('ERROR loading module "%s"', id);
            this.logger.error('path %s', path);
            this.logger.error(e.message);
            this.logger.error(e.stack);
            output.reject(e);
        }

        //TODO: move out of here :)
        if(instance){
            this.app.register(instance, id);
        }

        return output.promise;
    }
}

function getPathToMain(){
    var sep = require('path').sep;
    var main = process.argv[1];
    main = main.split(sep);
    main.pop();
    main = main.join(sep);
    return main;
}

module.exports = ModuleLoader;

var loader = new ModuleLoader();
var dir = process.argv[2] || __dirname;
console.log('loading ', dir);
loader.collectDirectory(dir).then(function(f){
    console.log('file', f);
}).catch(function(err){
    console.error(err);
});
