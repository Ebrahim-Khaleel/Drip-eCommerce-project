const order = require('../models/orderModel')
const cart = require('../models/cartModel')
const address = require('../models/addressModel')

const loadOrderDetails = async(req, res) => {
    try{
        const orderId = req.params.id
        const orders = await order.findById(orderId).populate('products.productId')
        
        res.render('users/orderDetails',{orders})
    }catch(error){
        console.log(error.message);
    }
}

const placeOrder = async(req, res) => {
    try{
        const userId = req.session.user_id
        const {COD,orderAmount} = req.body
        console.log("cod ::: "+COD);
        const cartItems = await cart.findOne({userId:userId}).populate('products.productId')
        const products = cartItems.products
        const addresses = await address.findOne({userId : userId})
        const {name, mobile, pincode, state, streetAddress, locality, city} = addresses
        console.log(cartItems.products);

        console.log(addresses);

        const orderPlaced = await order.create({
            userId : userId,
            products : products,
            deliveryAddress : {
                name : name,
                mobile : mobile,
                pincode : pincode,
                state : state,
                streetAddress : streetAddress,
                locality : locality,
                city : city
            },
            orderAmount : orderAmount,
            payment : "Cash on Delivery",
            orderDate : Date.now(),
            orderStatus : "Pending"
        })

        if(orderPlaced){
            res.redirect('/successMessage')
        }


    }catch(error){
        console.log(error.message);
    }
}

const thankYou = async(req, res) =>{
    try{
        res.render('users/thankYou')
    }catch(error){
        console.log(error.message);
    }
}

module.exports = {
    loadOrderDetails,
    placeOrder,
    thankYou
}