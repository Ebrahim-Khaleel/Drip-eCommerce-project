const order = require('../models/orderModel')
const cart = require('../models/cartModel')
const coupon = require('../models/couponModel')
const address = require('../models/addressModel')
const product = require('../models/productModel')
const paypal = require('../config/paypal')

const loadOrderDetails = async(req, res) => {
    try{
        const orderId = req.params.id
        const orders = await order.findById(orderId).populate('products.productId')
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')

        res.render('users/orderDetails',{orders,cartItems})
    }catch(error){
        console.log(error.message);
    }
}

const CODorder = async(req, res) => {
    try{
        const userId = req.session.user_id
        const {paymentMethod,selectedAddress,orderAmount} = req.body
        console.log("cod ::: "+paymentMethod);
        const cartItems = await cart.findOne({userId:userId}).populate('products.productId')
        const products = cartItems.products

        // products.forEach(prod=>{
        //     prod.quantity
        // })

        console.log('herer');
        console.log(selectedAddress);

        const addresses = await address.findOne({_id : selectedAddress})
        const {name, mobile, pincode, state, streetAddress, locality, city} = addresses

        console.log(cartItems.products);


        // console.log(addresses);

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
            payment : paymentMethod,
            orderDate : Date.now(),
            orderStatus : "Pending"
        })

        if(orderPlaced){

            orderPlaced.products.forEach(async(prod)=>{
                console.log(prod.productId);
                
                const orderedProduct = await product.findOne({_id:prod.productId})

                console.log(orderedProduct.quantity);
                let updatedStock = orderedProduct.quantity - prod.quantity

                await product.findOneAndUpdate({_id:prod.productId},{$set:{quantity : updatedStock}})

            })
            
        }

        await cart.findOneAndDelete({userId:userId})
        
        res.json({success:true})

    }catch(error){
        console.log(error.message);
    }
}

const thankYou = async(req, res) =>{
    try{
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')
        res.render('users/thankYou',{cartItems})
    }catch(error){
        console.log(error.message);
    }
}

const orderCancellation = async(req, res) => {
    try{
        const {productId,orderId,price,cancelReason} = req.body
        const userId = req.session.user_id

        const cancelled = await order.findOneAndUpdate({_id : orderId, 'products.productId' : productId},{
            $set : { 'products.$.orderStatus' : 'Cancelled', 'products.$.cancelled' : true, 'products.$.cancelReason' : cancelReason }
        })

        cancelled.products.forEach(async(prod)=>{
            const eproduct = await product.findOne({_id:prod.productId})
            let updatedStock = eproduct.quantity + prod.quantity

            await product.findOneAndUpdate({_id:prod.productId},{$set:{quantity:updatedStock}})
        })

        res.json({success:true})

    }catch(error){
        console.log(error.message);
    }
}

const returnOrder = async(req, res) => {
    try{
        const {productId,orderId,price,returnReason} = req.body
        const userId = req.session.user_id

        const returned = await order.findOneAndUpdate({_id : orderId, 'products.productId' : productId},{
            $set : { 'products.$.orderStatus' : 'Returned', 'products.$.returned' : true, 'products.$.returnReason' : returnReason }
        })

        returned.products.forEach(async(prod)=>{
            const eproduct = await product.findOne({_id:prod.productId})
            let updatedStock = eproduct.quantity + prod.quantity

            await product.findOneAndUpdate({_id:prod.productId},{$set:{quantity:updatedStock}})
        })

        if(returned){
            res.json({success:true})
        }

    }catch(error){
        console.log(error.message);
    }
}

const paypalPayment = async(req,res) =>{
    try{
        console.log('entered the controller')
        //items for payment

        const image = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60"

        const items = [{
            "name": "Product1", //product name
            "sku": '001', //unique identifier for product (you can use _id from database)
            "price": '1', //price
            "currency": "USD", //currency
            "quantity": 1, //quantity
            "url": image //image url if available (optional)
        }, {
            "name": "Product1",
            "sku": '001',
            "price": '1',
            "currency": "USD",
            "quantity": 1,
            "url": image
        }

        ]

        const amount = {
            "currency": "USD", //currency
            "total": "2" //total amount
        }

        const paymentData = {

            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "http://localhost:4001/successMessage", // if sucessfull return url
                "cancel_url": "http://localhost:4001/paypalcancel" // if canceled return url
            },
            "transactions": [{
                "item_list": {
                    "items": items // the items
                },
                "amount": amount, // the amount
                "description": "Payment using PayPal"
            }]

        }
        console.log('before payment create')

        const paymentUrl = await createPayment(paymentData);
        res.json({redirectUrl : paymentUrl})

        console.log('after payment create')

    }catch(error){
        console.log(error.message);
    }
}

const createPayment = (paymentData) => {
    return new Promise((resolve, reject) => {
      paypal.payment.create(paymentData, function (err, payment) {
        if (err) {
          reject(err);
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === "approval_url") {
                resolve(payment.links[i].href);
                return; // Ensure to return after resolving
                }
            }
        }
      });
    });
  };
  

const handlePayment = async(req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
  
    const executePayment = {
      payer_id: payerId,
    };
  
    paypal.payment.execute(paymentId, executePayment, (error, payment) => {
      if (error) {
        console.error('Error executing PayPal payment:', error);
        res.redirect('/paypalcancel');
      } else {
        
        res.send('Payment Success'); 
      }
    });
  }

  const handlePaymenterror = async(req,res)=>{
    try{
        res.redirect('/checkout')
    }catch(error){
        console.log(error.message);
    }
  }

module.exports = {
    loadOrderDetails,
    CODorder,
    thankYou,
    orderCancellation,
    returnOrder,
    paypalPayment,
    handlePayment,
    handlePaymenterror
}