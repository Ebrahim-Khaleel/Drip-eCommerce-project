const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    name : {
        type : String,
        required : true
    },

    price : {
        type : Number,
        required : true
    },

    quantity : {
        type : Number,
        required : true
    },
    
    description : {
        type : String,
        required : true
    },
    
    images : {
        type : Array,
        required : true
    },

    category : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'category',
        required :  true
    },

    isDeleted : {
        type : Boolean,
        default : false
    }
})

module.exports = mongoose.model('product',productSchema)