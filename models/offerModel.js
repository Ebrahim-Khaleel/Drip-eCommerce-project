const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    
    name : {
        type : String,
        required : true
    },

    percentage : {
        type : Number,
        required : true
    },

})

module.exports = mongoose.model('offer',offerSchema)