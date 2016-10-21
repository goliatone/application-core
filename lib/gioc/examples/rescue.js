var Gioc = require('..');
console.log("GIOC");

var container = {};
var gioc = new Gioc();
gioc.logger.error = console.error.bind(console);

//We add a rescuer routine to try to load beans
//that have not been mapped.
gioc.addRescuer(require('../gioc-node-rescuer'));

/*
 * Try to add a dependency solver based on require
 * We might have to keep track of dependencies, and only
 * execute next solver if the previous one failed, so we
 * might want to modify the array as we go, to remove the
 * beanId from the next loop.
 */
gioc.addSolver('dependencies', require('../gioc-node-dependency-solver'));


//We are calling solve without having mapped debug before
var d = gioc.solve('debug', {args:'pepe', construct: true});

console.assert(d);
console.log(d('hola'));
