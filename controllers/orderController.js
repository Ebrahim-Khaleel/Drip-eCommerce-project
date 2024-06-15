const order = require('../models/orderModel')
const cart = require('../models/cartModel')
const coupon = require('../models/couponModel')
const address = require('../models/addressModel')
const product = require('../models/productModel')
const wallet = require('../models/walletModel')
const paypal = require('../config/paypal')
const flash = require('express-flash')

const loadOrderDetails = async(req, res) => {
    try{
        const orderId = req.params.id
        const orders = await order.findById(orderId).populate('products.productId')
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')

        const pendingProds = orders.products.filter(product=> product.orderStatus === 'Pending')
        const deliveredProds = orders.products.filter(product=> product.orderStatus === 'Delivered')

        res.render('users/orderDetails',{orders, cartItems, pendingProds, deliveredProds})
    }catch(error){
        console.log(error.message);
    }
}

const loadInvoice = async(req, res) =>{
    try{
        res.render('users/invoice')
    }catch(error){
        console.log(error.message);
    }
}

const CODorder = async(req, res) => {
    try{
        const userId = req.session.user_id
        const {paymentMethod,selectedAddress,orderAmount,discountPrice,subTotal} = req.body
        console.log(paymentMethod);
        const cartItems = await cart.findOne({userId:userId}).populate('products.productId')
        const products = cartItems.products

        const addresses = await address.findOne({_id : selectedAddress})
        const {name, mobile, pincode, state, streetAddress, locality, city} = addresses

        // if coupon is apllied for product
        let discPrice = 0;
        discPrice = discountPrice / products.length


        const updatedProducts = products.map((product)=>{
            const discAmount = product.productId.price - discPrice
            return {
                productId: product.productId._id,
                quantity: product.quantity,
                totalPrice: discAmount,
                orderStatus:'Shipped'
            }
        })

        const orderPlaced = await order.create({
            userId : userId,
            products : updatedProducts,
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
        })

        if(orderPlaced){

            orderPlaced.products.forEach(async(prod)=>{
                console.log(prod.productId);
                
                const orderedProduct = await product.findOne({_id:prod.productId})

                console.log(orderedProduct.quantity);
                let updatedStock = orderedProduct.quantity - prod.quantity

                await product.findOneAndUpdate({_id:prod.productId},{$set:{quantity : updatedStock}})
                delete req.session.coupon

            })
            
        }

        await cart.findOneAndDelete({userId:userId})

        if(paymentMethod == "Wallet"){
            await wallet.findOneAndUpdate({userId : req.session.user_id},{$inc:{balance:-orderAmount},$push: {transaction: {amount:orderAmount,creditOrDebit:'debit'}}}, {new:true})
        }
        
        req.flash('success', 'Payment succeeded. Your order has been placed.');
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

        const errorMessage = req.flash('error')
        const successMessage = req.flash('success')

        res.render('users/thankYou',{cartItems, errorMessage,successMessage})
    }catch(error){
        console.log(error.message);
    }
}

const orderCancellation = async(req, res) => {
    try{
        const {productId,orderId,price,cancelReason} = req.body
        const userId = req.session.user_id

        const cancelled = await order.findOneAndUpdate({userId : userId, _id : orderId, 'products.productId' : productId},{
            $set : { 'products.$.orderStatus' : 'Cancelled', 'products.$.cancelled' : true, 'products.$.cancelReason' : cancelReason }
        },{new : true})
        
        if(cancelled){

            const cancelledProduct = cancelled.products.find((prod)=>prod.productId.toString() === productId);

            if(cancelledProduct){

                const eproduct = await product.findOne({_id:cancelledProduct.productId})
                let updatedStock = eproduct.quantity + cancelledProduct.quantity;

                await product.findOneAndUpdate({_id: cancelledProduct.productId},{$set:{quantity:updatedStock}})
                const netAmount = cancelledProduct.totalPrice * cancelledProduct.quantity;

                if(cancelled.payment == "Online Payment"){

                    await wallet.findOneAndUpdate({userId:userId},
                        {$inc:{balance : parseFloat(netAmount.toFixed(2))},
                        $push: {transaction :{amount:parseFloat(netAmount.toFixed(2)), creditOrDebit:'credit'}}
                        },
                        {new : true, upsert:true})
                }
            }
        
            res.json({success:true})
        }

    }catch(error){
        console.log(error.message);
    }
}

const returnRequest = async(req,res) =>{
    try{
        const {productId,orderId,price,returnReason} = req.body
        const userId = req.session.user_id

        await order.findOneAndUpdate({userId:userId,_id : orderId, 'products.productId' : productId},{
            $set : { 'products.$.orderStatus' : 'Return Requested', 'products.$.returnReason' : returnReason }
            },{new:true})

        res.json({success:true})
    
    }catch(error){
        console.log(error.message);
    }
}

const returnOrder = async(req, res) => {
    try{
        const {productId,orderId,returnReason,userId} = req.body

        const returned = await order.findOneAndUpdate({userId:userId,_id : orderId, 'products.productId' : productId},{
            $set : { 'products.$.orderStatus' : 'Returned', 'products.$.returned' : true, 'products.$.returnReason' : returnReason }
        },{new:true})

        if(returned){

            const returnedProduct =returned.products.find((prod)=>prod.productId.toString()==productId)

            if(returnedProduct){
                const eproduct = await product.findOne({_id:productId})
                let updatedStock = eproduct.quantity + returnedProduct.quantity;

                await product.findOneAndUpdate({_id:productId},{$set:{quantity:updatedStock}})
                await wallet.findOneAndUpdate({userId:userId},
                    {$inc:{balance:parseFloat(returnedProduct.totalPrice.toFixed(2))},
                    $push: {transaction :{amount:parseFloat(returnedProduct.totalPrice.toFixed(2)), creditOrDebit:'credit'}}},
                    {new : true, upsert:true})
            }
            
        }
        console.log('Returned');
        res.json({success:true})

    }catch(error){
        console.log(error.message);
    }
}

const paypalPayment = async(req,res) =>{
    try{
        console.log('entered the controller')
        //items for payment

        const userId = req.session.user_id
        const {paymentMethod,selectedAddress,discountPrice,subTotal} = req.body
        let {orderAmount} = req.body

        orderAmount = parseFloat(orderAmount)
        console.log( " amontt ;;;; "+orderAmount.toFixed(2));

        const cartItems = await cart.findOne({userId:userId}).populate('products.productId')
        const products = cartItems.products

        const items = products.map(product => {
            return {
                name: product.productId.name, // Product name
                sku: product.productId._id, // Unique identifier for product
                price: product.productId?.price, // Price per item 
                currency: "USD", // Currency
                quantity: product.quantity, // Quantity 
            };
        });

        const amount = {
            currency: "USD", // Currency
            total:orderAmount.toFixed(2),
            details :{
                subtotal : subTotal,
                discount:discountPrice
            }
        };

        console.log('amount end');

        const paymentData = {
            intent: "sale",
            application_context : {
                shipping_preference :'NO_SHIPPING',
                user_action:'CONTINUE',
            },
            payer: {
                payment_method: "paypal"
            },
            redirect_urls: {
                return_url: "http://localhost:4001/paypalsuccess", // If successful return URL
                cancel_url: "http://localhost:4001/paypalcancel" // If canceled return URL
            },
            transactions: [{
                item_list: {
                    items: items // The items
                },
                amount: amount, // The amount
                description: "Payment using PayPal"
            }]
        };
        console.log('peymant data ends');

        const paymentUrl = await createPayment(paymentData);

        console.log("creat peyment");
        // saving to the session
        req.session.paymentData = {
            userId : userId,
            paymentMethod : paymentMethod,
            selectedAddress : selectedAddress,
            discountPrice : discountPrice,
            subTotal: subTotal,
            orderAmount: orderAmount,
            products: products
        }

        res.json({redirectUrl : paymentUrl})

        console.log('after payment create')

    }catch(error){
        console.log(error.message);
    }
}

const createPayment = (paymentData) => {
    return new Promise((resolve, reject) => {
        // Create payment with PayPal
        paypal.payment.create(paymentData, function (err, payment) {
            if (err) {
                // Log and reject the Promise if there's an error
                console.error("Error creating payment:", err.response.details);
                reject(err);
            } else {
                // Log success message
                console.log("Payment created successfully.");
                // Find approval URL in payment links
                const approvalUrl = payment.links.find(link => link.rel === "approval_url");
                if (approvalUrl) {
                    // Resolve Promise with approval URL
                    resolve(approvalUrl.href);
                } else {
                    // Reject Promise if approval URL is not found
                    reject(new Error("Approval URL not found in payment response."));
                }
            }
        });
    });
};  

const handlePayment = async (req, res) => {    
    try{
        const payerId = req.query.PayerID;
        const paymentId = req.query.paymentId;

        // FOR FAILING THE PAYMENT
        // let forceFailure = true;

        const executePayment = {
            payer_id: payerId,
        }; 
    
        paypal.payment.execute(paymentId, executePayment, async (error, payment) => {
            try{

            // if (forceFailure === true) {
            //     error = new Error('Simulated payment failure for testing purposes.');
            //     console.log('Simulating payment failure...');
            // }
    
            if (error) {
                console.error('Error executing PayPal payment:', error);
    
    
                const { userId, paymentMethod, selectedAddress, discountPrice, orderAmount, products } = req.session.paymentData;
                const orderAmount1 = parseFloat(orderAmount);
                
    
                const addresses = await address.findOne({ _id: selectedAddress });
                const { name, mobile, pincode, state, streetAddress, locality, city } = addresses;
    
                
                let discPrice = discountPrice / products.length;
    
                const updatedProducts = products.map((product) => {
                    const discAmount = product.productId.price - discPrice;
                    return {
                        productId: product.productId._id,
                        quantity: product.quantity,
                        totalPrice: discAmount,
                        orderStatus: 'Pending'
                    };
                });
    
                const orderPlaced = await order.create({
                    userId: userId,
                    products: updatedProducts,
                    deliveryAddress: {
                        name: name,
                        mobile: mobile,
                        pincode: pincode,
                        state: state,
                        streetAddress: streetAddress,
                        locality: locality,
                        city: city
                    },
                    orderAmount: orderAmount1.toFixed(2),
                    payment: paymentMethod,
                    orderDate: Date.now(),
                    
                });
    
                if (orderPlaced) {
                    console.log('Order placed successfully with status pending.');
                    orderPlaced.products.forEach(async (prod) => {
                        const orderedProduct = await product.findOne({ _id: prod.productId });
                        let updatedStock = orderedProduct.quantity - prod.quantity;
                        await product.findOneAndUpdate({ _id: prod.productId }, { $set: { quantity: updatedStock } });
                    });
    
                    await cart.findOneAndDelete({ userId: userId });
                }
    
                delete req.session.paymentData;
                delete req.session.coupon;
    
                req.flash('error', 'Payment failed. Your order is created with a pending status. Please complete the payment from your orders page.');
                res.redirect('/successMessage');
    
            } else {
    
                console.log('Payment executed successfully.');
    
                const { userId, paymentMethod, selectedAddress, discountPrice, orderAmount, products, orderId } = req.session.paymentData;
    
                const existingOrder = await order.findOne({_id:orderId}).populate('products.productId')
    
                if(existingOrder){
                    console.log('ivedededede')

                    existingOrder.products.forEach(prod => {
                        prod.orderStatus = 'Shipped';
                    });
                    await existingOrder.save();

                } else {
                    const orderAmount1 = parseFloat(orderAmount);
    
                    let discPrice = discountPrice / products.length;
        
                    const updatedProducts = products.map((product) => {
                        const discAmount = product.productId.price - discPrice;
                        return {
                            productId: product.productId._id,
                            quantity: product.quantity,
                            totalPrice: discAmount,
                            orderStatus:'Shipped'
                        };
                    });

                    const addresses = await address.findOne({ _id: selectedAddress });

                    const { name, mobile, pincode, state, streetAddress, locality, city } = addresses;
                    console.log(addresses)

                    const orderPlaced = await order.create({
                        userId: userId,
                        products: updatedProducts,
                        deliveryAddress: {
                            name: name,
                            mobile: mobile,
                            pincode: pincode,
                            state: state,
                            streetAddress: streetAddress,
                            locality: locality,
                            city: city
                        },
                        orderAmount: orderAmount1.toFixed(2),
                        payment: paymentMethod,
                        orderDate: Date.now(),
                    });
    
                    if (orderPlaced) {
                        console.log('Order placed successfully with status shipped.');
                        orderPlaced.products.forEach(async (prod) => {
                            const orderedProduct = await product.findOne({ _id: prod.productId });
                            let updatedStock = orderedProduct.quantity - prod.quantity;
                            await product.findOneAndUpdate({ _id: prod.productId }, { $set: { quantity: updatedStock } });
                        });
    
                        await cart.findOneAndDelete({ userId: userId });
                    }
                    delete req.session.coupon;
                }            
                delete req.session.paymentData;
    
                req.flash('success', 'Payment succeeded. Your order has been placed.');
                res.redirect('/successMessage');
            }
            }catch(error){
                console.log(error.message)
            }
        });

    }catch(error){
        console.log(error.message)
    }
};


const handlePaymenterror = async(req,res)=>{
    try{

        console.log('   cancceell aaakiiii   ');

        res.redirect('/checkout')
    }catch(error){
        console.log(error.message);
    }
}

const failedPayment = async(req, res) => {
    try{
        const userId = req.session.user_id
        const {orderId} = req.body
        const thisOrder = await order.findOne({_id:orderId}).populate('products.productId')

        console.log((thisOrder));

        const products = thisOrder.products
        let orderAmount = thisOrder.orderAmount
        orderAmount = parseFloat(orderAmount)

        const items = products.map(product => {
            return {
                name: product.productId.name, // Product name
                sku: product.productId._id, // Unique identifier for product
                price: product.productId?.price.toFixed(2), // Price per item 
                currency: "USD", // Currency
                quantity: product.quantity, // Quantity 
            };
        });

        const amount = {
            currency: "USD", // Currency
            total:orderAmount.toFixed(2),
        };

        console.log('amount end');

        const paymentData = {
            intent: "sale",
            application_context : {
                shipping_preference :'NO_SHIPPING',
                user_action:'CONTINUE',
            },
            payer: {
                payment_method: "paypal"
            },
            redirect_urls: {
                return_url: "http://localhost:4001/paypalsuccess", // If successful return URL
                cancel_url: "http://localhost:4001/paypalcancel" // If canceled return URL
            },
            transactions: [{
                item_list: {
                    items: items // The items
                },
                amount: amount, // The amount
                description: "Payment using PayPal"
            }]
        };
        console.log('peymant data ends');

        const paymentUrl = await createPayment(paymentData);

        console.log("creat peyment");

        console.log(userId);
        console.log(thisOrder.deliveryAddress);
        // saving to the session
        req.session.paymentData = {
            userId : userId,
            paymentMethod : thisOrder.payment,
            selectedAddress : thisOrder.deliveryAddress,
            orderAmount: orderAmount.toFixed(2),
            products: products,
            orderId:thisOrder._id
        }

        res.json({redirectUrl : paymentUrl})
        
        
    }catch(error){
        console.log(error.message);
    }
}


module.exports = {
    loadOrderDetails,
    loadInvoice,
    CODorder,
    thankYou,
    orderCancellation,
    returnRequest,
    returnOrder,
    paypalPayment,
    handlePayment,
    handlePaymenterror,
    failedPayment
}