/*jshint esversion:6, node:true*/
'use strict';

var _slice = Array.prototype.slice;

var _isFactory = function(bean){
    if(this.factoryKey in bean.config) return bean.config[this.factoryKey];
    return typeof bean.context === 'function';
};

function _isLiteral(target){
    return (typeof target !== 'object');
}

function _isObject(obj){
    if(!obj) return false;
    return obj.constructor.name === 'Object';
}

function _getFunctionName(solver){
    var match = (/function\s?(\w+)\s?\(/g).exec(solver.toString());
    if(!match) return '__anonimous__';
    return match[1];
}

var _shimConsole = function(){
    var empty = {},
        con   = {},
        noop  = function() {},
        properties = 'memory'.split(','),
        methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
                   'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
                   'table,time,timeEnd,timeStamp,trace,warn').split(','),
        prop,
        method;

    while ((method = methods.pop())){
        con[method] = noop;
    }

    while ((prop = properties.pop())){
        con[prop] = empty;
    }

    return con;
};

////////////////////////////////////////
/// CONSTRUCTOR
////////////////////////////////////////

/**
 * Gioc constructor.
 *
 * @param  {Object} config Optional config object.
 */
var Gioc = function Gioc(config){
    //Store all bean info.
    this.beans = {};
    this.graph = {};

    this.solvers = {};
    this.postProcessors = [];

    this.providers = [];
    this.rescuers = [];

    this.configure(config);

    /*
     * Providers build the configuration object,
     * or provide context for the bean. By default
     * we just merge objects
     */
    this.addProvider(this.extend);

    //Solvers methods should have a common signature:
    //id, target, options (which should be similar throught all methods)
    this.addSolver(this.propertiesKey, this.extend);
    this.addSolver(this.dependenciesKey, this.solveDependencies);
    this.addSolver(this.exposeKey, this.expose);

    //TODO: Should addPost and addProvider have the
    //same signature as addSolver?
    this.addPost(this.resetGraph);
};

////////////////////////////////////////
/// STATIC VARS
////////////////////////////////////////
//TODO: Add support for chain props.
//TODO: If we modify this, ie unit testing,
//      then we cant reset. REMOVE STATIC or have
//      a default src.
Gioc.config = {
    attributes:[
        'dependenciesKey', 'propertiesKey',
        'postInjectKey','postInjectArgsKey',
        'modifierKey', 'factoryKey',
        'exposeKey', 'strictErrors',
        'container'
    ],
    defaults:{
        exposeKey: 'expose',
        dependenciesKey: 'dependencies',
        propertiesKey: 'properties',
        postInjectKey: 'postInject',
        modifierKey:   'modifier',
        postInjectArgsKey: 'postInjectArguments',
        factoryKey: 'construct',
        strictErrors: false,
        globalContext: global ? global : window,
        container: global ? global : window,
        // container: {}
    }
};

Gioc.VERSION = '0.2.0';

////////////////////////////////////////
/// PUBLIC METHODS
////////////////////////////////////////
/**
 * Handles configuration.
 * @param  {Object} config Configuration object
 * @return {this}
 */
Gioc.prototype.configure = function(config){
    //TODO: This should be configurable.
    /* Default supported directives:
     * - deps: dependencies
     * - post: post wire execution
     * - props: add props to instantiated value.
     */
    config = this.extend({}, Gioc.config.defaults, config);

    Gioc.config.attributes.map(function(ckey){
        this[ckey] = config[ckey];
    }, this);

    return this;
};

/**
 * Stores a definition, with configuration
 * options, to be *solved* later.
 *
 * The context can be either a literal value
 * or a factory method.
 *
 * @param  {String} beanId      String ID.
 * @param  {Object|Function} context Value to be map.
 * @param  {Object} config   Options for current mapping.
 * @return {Gioc}
 */
Gioc.prototype.map = function(beanId, context = this.container, config){
    //Store basic information of our context.
    var bean = {beanId: beanId, context: context, config: (config || {})};

    //Is this a factory or a literal value?
    bean.construct =
    bean.isFactory = _isFactory.call(this, bean);

    //TODO: How do we want to handle collision? We are overriding.
    if(this.mapped(beanId)) this.logger.warn(beanId, 'beanId is already mapped, overriding.');

    this.beans[beanId] = bean;

    return this;
};

/**
 * Solve for the provided *beanId*, it returns
 * a value and solves all dependencies, etc.
 *
 * The cycle to solve for a beanId is the result
 * of runing the methods in order:
 * - `prepare` as a pre process
 * - `build` to generate the context
 * - `wire` to solve dependencies
 * - `post` as a post process
 *
 * @param  {String} beanId      String ID we are solving
 *                           for
 * @param  {Object} options   Options object.
 *
 * @return {Object|undefined} Solved value
 *                            for the given beanId.
 */
Gioc.prototype.solve = function(beanId, options){
    //TODO: If we try to solve an unregistered beanId, what should
    //we do? Throw or return undefined?
    if (!this.mapped(beanId)){
        return this.rescue(beanId, options);
    }

    var value  = null,
        bean   = this.beans[beanId],
        config = {};

    console.log('* solve', beanId, options/*, bean*/);

    //pre-process
    this.prepare(beanId, config, bean.config, options);

    console.log('- solve: generated config ', config/*, bean*/);
    this.logger.log('==> solve, generated config ', config, options);

    //build our value.
    value = this.build(beanId, config);

    //configure our value:
    value = this.wire(beanId, value, config);

    //do all post 'construct' operations.
    this.post(beanId, value, config);

    return value;
};

/**
 * Pre process to consolidate the configuration
 * object for a given beanId.
 *
 * It will loop over all providers in order the order
 * they were added and call the provider with the
 * Gioc instance as scope.
 * The default provider is the `extend` method.
 *
 * @param  {String} beanId      String ID we are solving
 *                           for
 * @param  {Object} target   Resulting object.
 * @param  {Object} config   Conf object stored with the
 *                           beanId.
 * @param  {Object} options  Conf object passed in the
 *                           method call.
 * @return {Gioc}
 */
Gioc.prototype.prepare = function(beanId, target, config, options){
    console.log('- prepare');
    (this.providers).map(function(provider){
        console.log('- prepare: provider %s', beanId);
        provider.call(this, beanId, target, config, options);
    }, this);
    return this;
};

/**
 * Retrieve the context value for the given *beanId*.
 * If the context is a literal value, we just return
 * it without any further steps. If the context is a
 * function then we execute it with the **scope** and
 * **args** provided in the config object.
 *
 * @param  {String} beanId      String ID we are solving
 *                           for
 * @param  {Object} options  Conf object passed in the
 *                           method call.
 * @return {Primitive|Object} Raw stored value for beanId.
 */
Gioc.prototype.build = function(beanId, options){
    //TODO: If we try to solve an unregistered beanId, what should
    //we do? Throw or return undefined?
    if (!this.mapped(beanId)){
        console.log('NOT FUCKING MAPPED');
        return undefined;
    }

    var bean   = this.beans[beanId],
        value  = bean.context;
console.log('VALUE', value);
    if(!value){
        console.log('- build: We dont have a value');
        return require(beanId);
    }

    //TODO: REFACTOR, CLEAN UP!!
    if(options &&
       this.factoryKey in options &&
       !options[this.factoryKey]) return value;

    if(!bean.construct) return value;

    var config = this.extend(beanId, {scope:this}, bean.config, options),
        args   = config.args,
        scope  = config.scope;
    if(args && !Array.isArray(args)) args = [args];

    value = value.apply(scope, args);

    return value;
};

/**
 * Goes over the `config` object's beanIds
 * and for any of its beanIds that has a related solver
 * it will apply the solver method to the
 * target.
 * Meant to be overridden with use.
 * Default solvers are the `extend` method
 * for the beanId `props` and `solveDependencies`
 * for the `deps` beanId.
 *
 * @param  {String} beanId      String ID we are solving
 *                           for
 * @param  {Primitive|Object} target Solved value for the
 *                                   provided beanId.
 * @param  {Object} config  Configuration object.
 * @return {Primitive|object}        Solved value.
 */
Gioc.prototype.wire = function(beanId, target, config){
    config = config || {};

    //We have a literal value. We might want to modify it?
    if(_isLiteral(target) && this.modifierKey in config){
        return config[this.modifierKey](target);
    }

    /*
     * solve is the intersection between all beanIds in the
     * config object and the solvers.
     */
    var keys  = Object.keys(this.solvers);
    var solve = Object.keys(config).filter(function(k){ return keys.indexOf(k) !== -1;});
    // console.log('required solvers',keys, solve, config);
    solve.map(function(ckey){
        (this.solvers[ckey]).map(function(solver){
            console.log('- wire: call solver %s', _getFunctionName(solver));
            solver.call(this, beanId, target, config[ckey]);
        }, this);
    }, this);

    return target;
};

/**
 * Injects a dependency into the provided `scope`
 *
 * @param  {String} beanId     String ID we are solving
 *                          for
 * @param  {Object} scope   Target to be injected
 * @param  {Object} options Options object.
 * @return {this}
 */
Gioc.prototype.inject = function (beanId, scope, options = {}) {

    if(this._injecting === beanId) return this.logger.error(beanId, 'Ciclical dependency');
    this._injecting = beanId;

    if(! this.mapped(beanId)) return this.logger.warn(beanId, 'Provided beanId is not mapped.');
    console.log('HERE!!!', beanId, options);
    var setter = options.setter || beanId,
        value  = this.solve(beanId, options);

    //It could be that we were unable to solve for beanId, how do
    //we handle it? Do we break the whole chain?
    if(value === undefined){
        return this.error(beanId, 'ERROR: Dependency "' + beanId + '" not found.');
    }

    if( typeof setter === 'function') setter.call(scope, value, beanId);
    else if( typeof setter === 'string') scope[setter] = value;

    //TODO: We should treat this as an array
    //TODO: This should be the 'initialize' phase!
    if(this.postInjectKey in options) options[this.postInjectKey].apply(scope, options[this.postInjectArgsKey]);

    return this;
};

/**
 * During the solve cycle, the post process applied
 * after the context has been configured, built, and
 * wired.
 * @param  {String} beanId     [description]
 * @param  {Primitive|Object} target  Result from solving beanId.
 * @param  {Object} options Options object.
 * @return {Gioc}
 */
Gioc.prototype.post = function(beanId, target, options){
    this.logger.log('post ', this.postProcessors);
    (this.postProcessors).map(function(processor){
        this.logger.log('processor ', processor, ' beanId ', beanId, ' options ', options);
        processor.call(this, beanId, target, options);
    }, this);
    return this;
};

Gioc.prototype.rescue = function(beanId, options){
    return this.rescuers.reduce(function(out, rescue){
        out = rescue.call(this, beanId, options);
        return out;
    }.bind(this), undefined);
};

Gioc.prototype.addRescuer = function(rescuer){
    this.rescuers.push(rescuer);
};

/**
 * Checks to see if *beanId* is currently
 * mapped.
 * TODO: If we add external solvers, then
 *       this check might be outdated. We
 *       need to add solver+mapper!
 *
 * @param  {String} beanId Definition id.
 * @return {Boolean}    Does a definition
 *                      with this beanId exist?
 */
Gioc.prototype.mapped = function(beanId){
    return  this.beans.hasOwnProperty(beanId);
};

/**
 * Solve an array of dependencies.
 *
 * @param  {Object} scope    Scope to which dependencies
 *                           will be applied to.
 * @param  {[type]} mappings Array contained deps.
 *                           definitions
 * @return {this}
 */
Gioc.prototype.solveDependencies = function $solveRequiredDependencies(beanId, scope, mappings){
console.log('----> SOLVE DEPENDENCIES', mappings);
    (this.graph = this.graph || {}) && ( this.graph[beanId] = beanId );

    /*
     * Try to add a dependency solver based on requirejs
     * We might have to keep track of dependencies, and only
     * execute next solver if the previous one failed, so we
     * might want to modify the array as we go, to remove the
     * beanId from the next loop.
     * We should use `every` or `some` instead of map.
     */
    mappings.map(function(bean){
        //Normalize bean def, if string, we ride on defaults.
        if(typeof bean === 'string') {
            bean = {id: bean, options: {setter: bean}};
        }

        //Catch circular dependency
        if(bean.id in this.graph){
            return this.error(beanId, 'ERROR: Circular Dependency detected.');
        }

        //store current bean id for CD.
        this.graph[bean.id] = beanId;

        //We should try catch this.
        this.inject(bean.id, scope, bean.options);

        //Bean resolved, move on.
        delete this.graph[bean.id];

    }, this);

    this.logger.log(beanId, this.graph);

    return this;
};

/**
 * Error handler. If `strictErrors` is true
 * it will throw the error. Else it will be
 * handled by `logger`.
 * @param  {String} beanId     Error beanId
 * @param  {String} message Message
 * @return {void}
 */
Gioc.prototype.error = function(beanId, message){
    if(this.strictErrors === true) throw new Error(beanId, message);
    this.logger.error(beanId, message);
};

/**
 * Solvers are functions that handle
 * specific `beanId`s in the configuration
 * bean.
 * We add solvers by beanId.
 *
 * @param {String} beanId    Solver ID
 * @param {Function} solver Solver implementation.
 */
Gioc.prototype.addSolver = function(beanId, solver){
    (this.solvers[beanId] || (this.solvers[beanId] = [])).push(solver);
    return this;
};

Gioc.prototype.removeSolver = function(beanId){
    //TODO
};

/**
 * Add a post solver function.
 * @param {Function} processor Post processor
 */
Gioc.prototype.addPost = function(processor){
    if(this.postProcessors.indexOf(processor) === -1){
        this.postProcessors.push(processor);
    }

    return this;
};

Gioc.prototype.addProvider = function(provider){
    if(this.providers.indexOf(provider) === -1){
        this.providers.push(provider);
    }

    return this;
};

Gioc.prototype.use = function(module){
    if(module.processor) this.addPost(module.processor);
    if(module.providerr) this.addProvider(module.provider);
    if(module.solver) this.addSolver(module.solver.beanId, module.solver.fn);
    return this;
};

Gioc.prototype.resetGraph = function(beanId, target, options){
    this.logger.log('=== DELETE GRAPH');
    if(beanId in this.graph) delete this.graph[beanId];
};

Gioc.prototype.expose = function $expose(beanId, target, options){
    console.log('- expose: options for %s', beanId, options)
    var context = _isObject(options) ? options : this.container;
    context[beanId] = target;
};

/**
 * Extend method. It has a common signature with
 * other methods- taking a beanId as first argument-
 * and ignoring it. Then just merging onto "target"
 * from left to right.
 *
 * Under the hood, is just doing a normal extend.
 *
 * @param  {Object} target Source object
 * @return {Object}        Resulting object from
 *                         meging target to params.
 */
Gioc.prototype.extend = function $extend(beanId, target, options, config){

    function get(k){
        var d = Object.getOwnPropertyDescriptor(source, k) || {value:source[k]};
        if (d.get) {
            target.__defineGetter__(k, d.get);
            if (d.set) target.__defineSetter__(k, d.set);
        } else if (target !== d.value) target[k] = d.value;
    }

    var i = 2, length = arguments.length, source;
    for ( ; i < length; i++ ) {
        // Only deal with defined values
        if ((source = arguments[i]) !== undefined ){
            Object.getOwnPropertyNames(source).forEach(get);
        }
    }

    return target;
};

/**
 * Stub method for logger.
 * By default is mapped to console.
 */
Gioc.prototype.logger = _shimConsole();

module.exports = Gioc;

var _i;
module.exports.instance = function(options){
    if(!_i) _i = new Gioc(options);
    return _i;
};
