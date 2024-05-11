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

    isBlocked : {
        type : Boolean,
        default : false
    },

    createdAt : {
        type : Date
    },

    offer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'offer'
    },

    offerPrice : {
        type : Number
    }
})

module.exports = mongoose.model('product',productSchema)