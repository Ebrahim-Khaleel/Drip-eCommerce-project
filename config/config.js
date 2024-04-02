const mongoose = require('mongoose');

module.exports = function dbconnect(){
    return mongoose.connect('mongodb://localhost:27017/DripLuxe')
}