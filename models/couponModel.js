const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({

    couponName : {
        type : String,
        required : true
    },

    couponCode : {
        type : String,
        required : true
    },

    couponDescription : {
        type : String,
        required : true
    },

    percentage: {
        type : Number,
        required : true
    },

    startDate : {
        type : Date,
        default : Date.now()
    },

    endDate : {
        type : Date
    }

},  {
        timestamps : true
    }
)

module.exports = mongoose.model('coupon',couponSchema)