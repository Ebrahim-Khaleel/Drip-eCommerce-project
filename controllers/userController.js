const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const category = require('../models/categoryModel')
const products = require('../models/productModel');
const address = require('../models/addressModel');
const cart = require('../models/cartModel');
const wishlist = require('../models/wishlistModel');
const wallet = require('../models/walletModel');
const order = require('../models/orderModel');
const passport = require('passport');
const googleStrategy = require('passport-google-oauth20').Strategy
require('dotenv').config()


// Loading Home Page
const showHome = async (req, res) => {
    try {
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')

        const allproducts = await products
        .find({isBlocked:false})
        .sort({createdAt : -1})
        .limit(4)
        .populate('category')

        console.log(allproducts)

        res.render('users/home',{newArrivals : allproducts,cartItems})
    } catch (error) {
        console.log(error.message);
    }
}

const showShop = async (req, res) => {
    try {
        const limit = 8;
        const page = parseInt(req.query.page) || 1
        const skip = (page - 1) * limit;
        const productsCount = await products.countDocuments({isBlocked:false});
        const totalPages = Math.ceil(productsCount / limit);

        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')
        const categories = await category.find({isBlocked:false})

        const showproductss = await products.
        find({isBlocked:false})
        .populate('category offer')
        .sort({_id:-1})
        .skip(skip)
        .limit(limit)

        res.render('users/shop', { showproducts:showproductss,cartItems,categories, currentPage : page, totalPages,productsCount})
    } catch (error) {
        console.log(error);
    }
}

const searchItems = async(req, res) =>{
    try{
        const findProduct = req.body.prod
        const searchedItem = await products.find({ name: { $regex: new RegExp(`.*${findProduct}.*`, 'i') } }).populate('category')
        res.json(searchedItem)

    }catch(error){
        console.log(error.message);
    }
}

const lowToHigh = async (req,res) => {
    try{
        const limit = 8;
        const page = parseInt(req.query.page) || 1
        const skip = (page - 1) * limit;
        const productsCount = await products.countDocuments({isBlocked:false});
        const totalPages = Math.ceil(productsCount / limit);

        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')
        const categories = await category.find({isBlocked:false})

        const lowtohigh = await products.find({isBlocked:false}).sort({price : 1}).populate('category').skip(skip).limit(limit)

        res.render('users/shop',{showproducts : lowtohigh,cartItems,categories, currentPage : page, totalPages,productsCount})
        
    }catch(error){
        console.log(error.message);
    }
}
const HighToLow = async (req,res) => {
    try{
        const limit = 8;
        const page = parseInt(req.query.page) || 1
        const skip = (page - 1) * limit;
        const productsCount = await products.countDocuments({isBlocked:false});
        const totalPages = Math.ceil(productsCount / limit);

        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')
        const categories = await category.find({isBlocked:false})

        const hightolow = await products.find({isBlocked:false}).sort({price : -1}).populate('category').skip(skip).limit(limit)

        res.render('users/shop',{showproducts : hightolow,cartItems,categories, currentPage : page, totalPages,productsCount})

    }catch(error){
        console.log(error.message);
    }
}
const popularity = async (req,res) => {
    try{
        const limit = 8;
        const page = parseInt(req.query.page) || 1
        const skip = (page - 1) * limit;
        const productsCount = await products.countDocuments({isBlocked:false});
        const totalPages = Math.ceil(productsCount / limit);

        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')
        const categories = await category.find({isBlocked:false})

        // const showproducts = await products.find({isBlocked:false}).populate('category')
        const popularity = await order.aggregate([
            {
                $unwind: '$products'
            },
            {
                $group: {
                    _id: '$products.productId',
                    totalCount: { $sum: '$products.quantity' }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productData'
                }
            },
            {
                $unwind: '$productData'
            },
            {
                $match : { 'productData.isBlocked':false }
            },
            {$sort: { totalCount: -1 }},
            {$skip: skip},
            {$limit: limit}
            
        ]);

        // Check if cartItems and categories are defined
        const popularProds = popularity.map(item => item.productData)

        res.render('users/shop',{showproducts : popularProds,cartItems,categories, currentPage : page,totalPages,productsCount})

    }catch(error){
        console.log(error.message);
    }
}
const latest = async (req,res) => {
    try{
        const limit = 8;
        const page = parseInt(req.query.page) || 1
        const skip = (page - 1) * limit;
        const productsCount = await products.countDocuments({isBlocked:false});
        const totalPages = Math.ceil(productsCount / limit);

        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')
        const categories = await category.find({isBlocked:false})

        const showproducts = await products.find({isBlocked:false}).sort({createdAt : -1}).populate('category').skip(skip).limit(limit)
        res.render('users/shop',{showproducts,cartItems,categories, currentPage : page, totalPages,productsCount})
    }catch(error){
        console.log(error.message);
    }
}

const categoryFiltering = async(req,res) =>{
    try{
        const limit = 8;
        const page = parseInt(req.query.page) || 1
        const skip = (page - 1) * limit;

        const categoryName = req.params.name

        const foundCategory = await category.findOne({name : categoryName},{isBlocked: false})
        if(!foundCategory){
            res.status(404).send('Category not found')
        }

        const productsCount = await products.countDocuments({category:foundCategory._id},{isBlocked:false});
        const totalPages = Math.ceil(productsCount / limit);
        
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')
        const categories = await category.find({isBlocked:false})
        
        const filteredProducts = await products.find({category:foundCategory._id},{isBlocked:false}).populate('category').skip(skip).limit(limit)

        res.render('users/shop', { showproducts : filteredProducts,cartItems,categories, currentPage : page, totalPages,productsCount})
    }catch(error){
        console.log(error.message);
    }
}

const showProductDetail = async (req, res) => {
    try {
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')

        const { id } = req.params
        const product = await products.findById(id)
        res.render('users/productDetail', {product, cartItems})

    } catch (error) {
        console.log(error);
    }
}



// Loading Sign Up Page
const showSignUp = async (req, res) => {
    try {
        res.render('users/signup')
    } catch (error) {
        console.log(error.message);
    }
}

// Securing Password using bcrypt
const securePassword = async (password) => {
    try {
        const hashedPass = await bcrypt.hash(password, 10)
        return hashedPass
    } catch (error) {
        console.log(error.message);
    }
}

const generateOtp = () => Math.floor(1000 + (Math.random() * 9000))

let otpExpiration = null;

// User registeration
const insertUser = async (req, res) => {
    try {

        const { name, email, phone, password } = req.body

        const existingEmail = await User.findOne({email:email})

        if(existingEmail){
            return res.render('users/signup',{emessage:'Email already exists'})
        }

        const encryptPass = await securePassword(password)

        const user = new User({
            name: name,
            email: email,
            phone: phone,
            password: encryptPass,
        })

        const verified = await verifyEmail(user.email, req)

        req.session.userData = user
        req.session.email = user.email

        console.log('req session userData' + req.session.userData);

        if (user) {
            res.redirect('/otp')
        } else {
            res.render('users/signup', { ermessage: 'invalid' })
            console.log('heree');
        }

    } catch (error) {
        console.log(error.message);
    }
}


const verifyEmail = async (email, req) => {
    try {

        // calling the function generate otp
        const Otp = generateOtp()
        req.session.otp = Otp;
        otpExpiration = Date.now() + 60000;

        //assigning the otp to the otp object
        // otpData.otp = Otp
        // otpData.expiration = Date.now() + 60000

        // Setting SMTP transporter
        const transport = nodemailer.createTransport({
            service: "gmail",

            auth: {
                user: process.env.USEREMAIL,
                pass: process.env.USERPASSWORD
            }
        });

        // Setting Mail Body
        const mailoption = {
            from: 'ebrahimkhaleel02@gmail.com',
            to: email,
            subject: 'For Mail verification',
            html: `<html>
                    <body style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <h1 style="color: #333;">Verify Your Email Address</h1>
                        <p style="color: #555; line-height: 1.5;">Enter the following OTP code to verify your email address. This code will expire in 1 minutes:</p>
                        <p style="font-size: 24px; font-weight: bold; color: #007bff;">${Otp}</p>
                        <p style="color: #555; line-height: 1.5;">If you did not request this verification, please ignore this email.</p>
                    </div>
                    </body>
                    </html>`
        }

        // Sending Mail
        transport.sendMail(mailoption, (err, info) => {
            if (err) {
                console.log(err.message);
            }
            else {
                console.log(`Email has been sent: ${info.messageId}`);
                console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        })

        req.session.otp = Otp

        console.log('generated OTP : ' + Otp);

    } catch (error) {
        console.log(error.message);
    }
}


// Load OTP Page
const showOtp = async (req, res) => {
    try {
        res.render('users/otp')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOtp = async (req, res) => {
    try {
        // user input Otp
        const userOtp = req.body.Otp

        console.log('User inputted OTP : ' + userOtp);

        if (otpExpiration && Date.now() > otpExpiration) {
            delete req.session.otp; // Clear OTP from session
            res.json({expired:true})
        }

        if (userOtp == req.session.otp) {

            if(req.session.userData){

                const { name, email, password, phone } = req.session.userData

                const data = await User.create({
                    name: name,
                    email: email,
                    phone: phone,
                    password: password
                })

                if (data) {
                    req.session.user_id = data._id;

                    await wallet.create({
                        userId : req.session.user_id
                    })

                    res.json({success:true})
                }
            } else {
                res.json({successForg:true})
            }

        } else {
            res.json({wrong:true})
        }

    } catch (error) {
        console.log(error.message);
    }
}

const resendOtp = async (req, res) => {

    try {
        const newOtp = generateOtp();

        const email = req.session.email
        req.session.otp = newOtp
        otpExpiration = Date.now() + 60000;

        await verifyEmail(email, newOtp)
        console.log('resendOtp : ' + newOtp);

        res.redirect('/otp')

    } catch (error) {
        console.log(error.message);
    }
}

// Load Login Page
const showLogin = async (req, res) => {
    try {
        res.render('users/login')
    } catch (error) {
        console.log(error.message);
    }
}

// ----------- Google login -----------
// const loadAuth = async(req,res)=>{
//     res.render('users/login')
// }

const successGoogleLogin = async(req,res)=>{
    try{
        console.log(req.user);
        res.redirect('/')
    }catch(error){
        console.log(error.message);
    }
}

const failureLogin = async(req,res)=>{
    try{
        res.render('users/login')
    }catch(error){
        console.log(error.message);
    }
}

passport.serializeUser((user, done) => {
    done(null, user);
})
  
passport.deserializeUser((user, done) => {
    done(null, user);
})

passport.use(
    new googleStrategy({
        clientID : process.env.GOOGLECLIENTID,
        clientSecret : process.env.GOOGLECLIENTSECRET,
        callbackURL : "http://localhost:4001/auth/google/callback",
        passReqToCallback : true
    },
    function (request, accessToken, refreshToken, profile, done){
        return done(null, profile)
    }

    )
)


// Verifying User Login
const verifyLogin = async (req, res) => {
    try {
        const { email, password} = req.body

        const userData = await User.findOne({ email: email })

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {

                if(!userData.isBlocked){

                    req.session.user_id = userData._id;
                    console.log(userData);
                    res.redirect('/')

                } else {
                    res.render('users/login', { Lmessage: "Sorry we can't find an account with that email and password" })
                }
                
            } else {
                res.render('users/login', { Pmessage: "Incorrect Password" })
            }
            
        } else {
            res.render('users/login', { Lmessage: "Sorry we can't find an account with that email and password" })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadMyAccount = async (req, res) => {
    try {
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')

        const userData = await User.findById({ _id: req.session.user_id })
        const addresses = await address.find({userId:userId}).sort({_id:-1}).limit(3)
        let orders = await order.find({userId:userId}).populate('products.productId').sort({_id:-1})
        const wallett = await wallet.findOne({userId:userId}, {transaction:1, _id : 0});
        wallett.transaction.sort((a, b) => new Date(b.time) - new Date(a.time))

        const walletb = await wallet.findOne({userId:userId})
        
        if(userData){
            res.render('users/myAccount',{userData,addresses,cartItems,orders,wallett, walletb})
        } else {
            res.redirect('/login')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const editProfile = async(req,res) => {
    try{
        const {name, phone} = req.body
        await User.findOneAndUpdate({_id:req.session.user_id},{$set:{name:name, phone:phone}})
        res.json({success:true})
    }catch(error){
        console.log(error.message);
        res.json({error : 'Error while updating Profile'})
    }
}

const changePassword = async(req,res) => {
    try{
        const {existingPassword,newPassword} = req.body

        const newSecured = await securePassword(newPassword)
        const user = await User.findOne({_id:req.session.user_id})
        const checkedPass = await bcrypt.compare(existingPassword,user.password)

        if(checkedPass){

            if(user.password === newPassword){
                console.log('entered password is same as existing one');
            } else {
                await User.findOneAndUpdate({_id:req.session.user_id},{$set:{password : newSecured}})
                console.log('password changed successfully');
                res.redirect('/myAccount');
            }
        }
    }catch(error){
        console.log(error.message);
    }
}

const loadWishlist = async(req,res) =>{
    try{
        // loading cart quantity
        const userId = req.session.user_id
        const cartItems = await cart.findOne({userId : userId}).populate('products.productId')

        const wishlists = await wishlist.findOne({userId:userId}).populate('products.productId')
        res.render('users/wishlist',{wishlists,cartItems})
    }catch(error){
        console.log(error.message);
    }
}

const addToWishlist = async(req, res) =>{
    try{
        const userId = req.session.user_id
        const {productId} = req.body
        console.log(productId);

        const exist = await wishlist.findOne({userId:userId, products:{ $elemMatch :{productId:productId} }})

        if(!exist){

            await wishlist.findOneAndUpdate(
                {userId : userId},
                { $addToSet : {
                    products : {
                        productId : productId
                    }
                }},
                {new : true, upsert : true}
            )

            res.json({success:true})
            console.log("product added to wishlist");
        
        }else{
            res.json({exist:true})
            console.log("product already in wishlist");
        }

    }catch(error){
        console.log(error.message);
    }
}

const removeFromWishlist = async(req, res) =>{
    try{
        const userId = req.session.user_id
        const {productId} = req.body

        await wishlist.findOneAndUpdate(
            {userId : userId},
            {$pull :
                { products:{
                    productId : productId
                }
            }}
        )

        res.json({success:true})

    }catch(error){
        console.log(error.message);
    }
}

const addMoneyToWallet = async(req, res) =>{
    try{
        const {amount} = req.body
        const adding = await wallet.findOneAndUpdate({userId : req.session.user_id},{$inc:{balance:amount},$push: {transaction: {amount:amount,creditOrDebit:'credit'}}}, {new:true})

        if(adding){
            res.json({success:true})
            console.log('Money added to Wallet successfully');
        }
    }catch(error){
        console.log(error.message);
    }
}

const userLogout = async (req, res) => {
    try {
        req.session.destroy()
        console.log('User Logged Out');
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

const loadForgotPage = async(req,res) => {
    try{
        res.render('users/forgotPass')
    }   catch(error){
        console.log(error.message)
    }
}

const forgotPassword = async(req, res) => {
    try{
        const email = req.body.email
        const exist = await User.findOne({email : email})

        if(!exist){
            res.render('users/forgotPass',{message : "Email doesn't exist"})
        } else {
            const verified = await verifyEmail(email, req)

            req.session.email = exist.email
            res.redirect('/otp')
        }

    }catch(error){
        console.log(error.message);
    }
}

const loadNewPass = async(req, res) =>{
    try{
        res.render('users/forgotConfirm')
    }catch(error){
        console.log(error.message);
    }
}

const forgetPassConfirm = async(req ,res) => {
    try{
        const email = req.session.email
        const password = req.body.password

        const encryptPass = await securePassword(password)
        const changed = await User.findOneAndUpdate({email:email},{$set:{password : encryptPass}})

        if(changed){
            res.redirect('/login')
        }

    }catch(error){
        console.log(error.message);
    }
}


module.exports = {
    showHome,
    showShop,
    searchItems,
    lowToHigh,
    popularity,
    HighToLow,
    latest,
    categoryFiltering,
    showSignUp,
    insertUser,
    showOtp,
    verifyOtp,
    resendOtp,
    showLogin,
    verifyLogin,
    verifyEmail,
    showProductDetail,
    loadMyAccount,
    editProfile,
    changePassword,
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
    addMoneyToWallet,
    userLogout,
    successGoogleLogin,
    failureLogin,
    loadForgotPage,
    forgotPassword,
    loadNewPass,
    forgetPassConfirm
}