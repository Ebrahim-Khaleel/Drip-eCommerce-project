const mongoose = require('mongoose');

module.exports = function dbconnect(){
    return mongoose.connect('mongodb+srv://ebrahimkhaleel:-XM52Q3dY2GX-k@cluster0.vh282rp.mongodb.net/')
    
}