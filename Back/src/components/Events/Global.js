const EventEmitter = require('events');

class Global extends EventEmitter{

}

module.exports = new Global();