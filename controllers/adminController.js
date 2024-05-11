const User = require('../models/userModel')
const admin = require('../models/adminModel')
const order = require('../models/orderModel')
const offer = require('../models/offerModel')



const loadLogin = async (req, res) => {
    try {
        res.render('admin/login')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyAdmin = async (req, res) => {
    try {
        const { email, password } = req.body

        const adminData = await admin.findOne({ email: email })

        if (adminData) {

            if (password===adminData.password) {
                req.session.admin_id = adminData._id
                res.redirect('/admin/home')
            } else {
                res.render('admin/login', { pMessage: 'Incorrect Password' })
            }

        } else {
            res.render('admin/login', { lMessage: 'Unauthorized admin' })
        }

    } catch (error) {
        console.log(error.messsage);
    }
}

const showSignUp = async (req, res) => {
    try {
        res.render('admin/signup')
    } catch (error) {
        console.log(error.message);
    }
}

const insertAdmin = async(req,res) => {
    try{
        const { email, password } = req.body

        const newAdmin = new admin({
            email : email,
            password : password
        })

        const adminSaved = await newAdmin.save()

        if(adminSaved){
            res.redirect('/admin/home')
        } else {
            res.render('admin/signup')
        }

    }catch(error){
        console.log(error.message);
    }                 
}

const loadHome = async (req, res) => {
    try {
        res.render('admin/home')
    } catch (error) {
        console.log(error.message);
    }
}

const adminLogout = async (req, res) => {
    try {
        req.session.destroy()
        console.log('Admin Logged Out');
        res.redirect('/admin/login')
    } catch (error) {
        console.log(error.message);
    }
}

const loadUsers = async (req, res) => {
    try {
        const usersData = await User.find()
        res.render('admin/users', { usersData })
    } catch (error) {
        console.log(error.message);
    }
}

const userBlocking = async(req,res) =>{
    try{
        const { userId } = req.body
        const userData = await User.findOne({_id:userId})

        if(!userData.isBlocked){
            await User.findByIdAndUpdate({_id:userId},{$set:{isBlocked:true}})
            console.log('User Blocked');
        } else {
            await User.findByIdAndUpdate({_id:userId},{$set:{isBlocked:false}})
            console.log('User Unblocked');
        }

        res.json({res:true})

    }catch(error){
        console.log(error.message);
    }
}

const loadOrders = async(req,res) => {
    try{
        const orders = await order.find().populate('products.productId').populate('userId')
        res.render('admin/orders',{orders})
    }catch(error){
        console.log(error.message);
    }
}

const loadOrdersDetails = async(req,res) => {
    try{
        const orderId = req.params.id
        const orderD = await order.findById(orderId).populate('products.productId').populate('userId')
        res.render('admin/ordersDetails',{orderD})
    }catch(error){
        console.log(error.message);
    }
}

const updateorderstatus = async(req, res)=> {
    try{
        const {status} = req.body
        const {orderId} = req.body
        const {productId} = req.body

        console.log(status);

        const updatedStatus = await order.findOneAndUpdate({_id : orderId, 'products.productId' : productId},
        { $set : {"products.$.orderStatus" : status}})

        res.json({success : true})

    }catch(error){
        console.log(error.message);
    }
}

const loadOffers = async(req,res) => {
    try{
        const offers = await offer.find()

        res.render('admin/offers',{offers})
    }catch(error){
        console.log(error.message)
    }
}

const addOffer = async(req,res) =>{
    try{
        const {name, percentage} = req.body

        const existingOffer = await offer.findOne({name : { $regex: new RegExp('^' + name + '$', 'i') } })

        if(existingOffer){
            return res.json({error : 'Offer with same name already exists'})
        }

        const newOffer = await offer.create({
            name : name,
            percentage : percentage
        })

        if(newOffer){
            console.log('new offer added')
            res.redirect('/admin/offers')
        }

    }catch(error){
        console.log(error.message);
    }
}

const editOffer = async(req,res) =>{
    try{
        const {offerId} = req.body
        const findedOffer = await offer.findOne({_id:offerId})
        res.json({ name : findedOffer.name, percentage : findedOffer.percentage })
         
    }catch(error){
        console.log(error.message);
    }
}

const saveEditOffer = async(req,res) =>{
    try{
        const {offerId,name,percentage} = req.body

        const existingOffer = await offer.findOne({name : { $regex: new RegExp('^' + name + '$', 'i') } })

        if(existingOffer){
            return res.json({error : 'Offer with same name already exists'})
        }

        await offer.findOneAndUpdate({_id:offerId}, {name : name, percentage : percentage})

        res.json({success : true})

    }catch(error){
        console.log(error.message);
    }
}

const offerDelete = async(req, res) =>{
    try{
        const {offerId} = req.body
        const done = await offer.findOneAndDelete({_id:offerId})

        if(done){
            res.json({success:true})
        }
    }catch(error){
        console.log();
    }
}



module.exports = {
    loadLogin,
    verifyAdmin,
    loadHome,
    loadUsers,
    adminLogout,
    showSignUp,
    insertAdmin,
    userBlocking,
    loadOrders,
    loadOrdersDetails,
    updateorderstatus,
    loadOffers,
    addOffer,
    editOffer,
    saveEditOffer,
    offerDelete,
}