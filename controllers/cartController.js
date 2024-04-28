const product = require('../models/productModel')
const cart = require('../models/cartModel')
const user = require('../models/userModel')
const address = require('../models/addressModel')

const loadCart = async(req,res)=>{
    try{
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')

        res.render('users/cart',{cartItems})
    }catch(error){
        console.log(error.message);
    }
}

const addToCart = async(req,res)=>{
    try{
        const productId = req.query.id
        const userId = req.session.user_id
        const quantity = req.body.quantity || 1

        if(!userId){
            console.log('no user');
            res.send({noUser:true})
        } else {

            const exist = await cart.findOne({ userId : userId, products: { $elemMatch : { productId : productId } } })
            if(!exist){

                await cart.findOneAndUpdate(
                    { userId : userId},
    
                    {
                        $addToSet : {
    
                            products :{
    
                                productId : productId,
                                quantity : quantity
    
                            }
    
                        }
                    },
    
                    { new : true, upsert : true }
                );
    
                res.send({ success : true })
                console.log(':::: Product Added successfully ::::');
            } else {
                res.send({ exist : true })
                console.log(':::: Product Already Added ::::');
            }

        }

    }catch(error){
        console.log(error.message);
    }
}

const updateCart = async(req,res)=>{
    try{
        const productId = req.body.prodId
        const updatedQuantity = req.body.updtdQuantity
        const cartID = req.body.cartId

        const updatedCart = await cart.findOneAndUpdate({_id : cartID, 'products.productId' : productId}, {
            $set : {"products.$.quantity" : updatedQuantity} },{new:true}
        )
        
        res.json({success:true})

    }catch(error){
        console.log(error.message);
    }
}

const removeFromCart = async(req,res) =>{
    try{
        const cartId = req.query.id
        const userId = req.session.user_id

        const removed = await cart.updateOne({userId : userId},{$pull: {products : { productId : cartId }}})

        if(removed){
            res.send(true)
        }

    }catch(error){
        console.log(error.message);
    }
}

const loadCheckout = async(req,res) => {
    try{
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')

        const addresses = await address.find({userId:userId})

        res.render('users/checkout',{cartItems,addresses})
    }catch(error){
        console.log(error.message);
    }
}

module.exports = {
    loadCart,
    addToCart,
    updateCart,
    removeFromCart,
    loadCheckout
}
