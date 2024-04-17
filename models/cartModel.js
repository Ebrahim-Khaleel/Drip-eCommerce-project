const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({

    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user',
        required : true
    },
    products : [{
        productId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'product',
        },
        quantity : {
            type : Number,
            default : 1
        },
        price : {
            type : Number,
            required : true
        }
    }],
    totalPrice : {
        type : Number
    }

})

module.exports = mongoose.model('cart',cartSchema)