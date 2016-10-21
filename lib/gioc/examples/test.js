var Gioc = require('..');
console.log("GIOC");

var container = {};
var gioc = new Gioc();
gioc.logger.error = console.error.bind(console);


gioc.addRescuer(require('../gioc-node-rescuer'));

gioc.addSolver('dependencies', require('../gioc-node-dependency-solver'));

function User(first, last){
    this.firstname = first;
    this.lastname = last;
    console.log('User:: constructor called');
}

User.prototype.fullName = function(){
    return this.firstname + ' ' + this.lastname;
};
function Ajax(){}

Ajax.prototype.getJSON = function(){
    console.log('Ajax::getJSON()');
};

function Sync(){}
Sync.prototype.load = function(){
    this.ajax.getJSON();
};

gioc.map('ajax', function(){ return new Ajax();}, {});

gioc.map('sync', function(options){
    console.log('options', options);
    return new Sync(options);
}, {
    dependencies: ['ajax']
});

gioc.map('userid', 123456789, {
    modifier: function(id){
        console.log('modifier ', id);
        return Math.round(id / 100000);
    }
});

gioc.map('user', function userFactory(first, last, age){
    console.log('+++++++ user factory: first %s last %s age %s', first, last, age);
    if(userFactory.user) return userFactory.user;
    var user = new User();
    userFactory.user = user;
    return user;
},
{
    properties:{ factoryOptions:true },
    args:['pepe', 'rone', 23],
    dependencies:[
        'userid',
        'gextend',
        {
            id:'sync',
            options:{
                properties:{ url:'localhost' },
                postInject: function(age, tag){
                    console.log('************ POST INJECT: hello sync age ', age, ' tag ', tag);
                },
                postInjectArguments:[23, 'injected-tag']
            }
        }
    ]
});


var pepe = gioc.solve('user', {
    properties:{
        firstname:'pepe',
        lastname:'rone'
    }
});
console.log('User pepe ', pepe);
console.log('pepe:fullName() ', pepe.fullName());

var app = {};

gioc.inject('user', app, {
    properties:{
        first:'Goliat',
        last:'One'
    }
});

console.log('App: injected user', app.user);
console.log('App: user.userid', app.user.userid);
app.user.sync.load();
