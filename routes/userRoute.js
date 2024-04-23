const express = require('express')
const userRoute = express()
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const addressController = require('../controllers/addressController')
const session = require('express-session')
const { isLogin, isLogout, userAuthorize, } = require('../middlewares/userAuth')
require('dotenv').config
const passport = require('passport')
require('../passport')

// session setting
userRoute.use(session({
    secret: process.env.SESSIONSECRET,
    resave: true,
    saveUninitialized: true
}))

// home page
userRoute.get('/', userController.showHome)
// login page
userRoute.get('/login', isLogout, userController.showLogin)
userRoute.post('/login', userController.verifyLogin)
// signup page
userRoute.get('/signup',userAuthorize, userController.showSignUp)
userRoute.post('/signup', userController.insertUser)
// otp
userRoute.get('/otp',userAuthorize, userController.showOtp)
userRoute.post('/otp', userController.verifyOtp)
userRoute.get('/resendOtp',userAuthorize, userController.resendOtp)
// shop and detail page
userRoute.get('/shop', userController.showShop)
userRoute.get('/productDetail/:id', userController.showProductDetail)
// cart
userRoute.get('/cart',isLogin, cartController.loadCart)
userRoute.post('/addToCart',cartController.addToCart)
userRoute.put('/cartUpdate',cartController.updateCart)
userRoute.post('/removeItem',cartController.removeFromCart)
// Profile
userRoute.get('/myAccount',isLogin, userController.loadMyAccount)
userRoute.patch('/editProfile',userController.editProfile)
userRoute.post('/addAddress',addressController.addAddress)
userRoute.post('/loadEditAddress',addressController.loadEditAddress)
userRoute.patch('/saveEditAddress',addressController.saveEditAddress)
userRoute.patch('/removeAddress',addressController.removeAddress)

// logout
userRoute.get('/logout',isLogin, userController.userLogout)

// google login
userRoute.use(passport.initialize());
userRoute.use(passport.session());

userRoute.use(session({
    secret: process.env.SESSIONSECRET,
    resave:false,
    saveUninitialized: true
}))

// userRoute.get('users/login',userAuthorize, userController.loadAuth)

userRoute.get('/auth/google',
    passport.authenticate('google',{
        scope : ['email', 'profile']
    })
)

userRoute.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/failure'
    })
);

userRoute.get('/', userController.successGoogleLogin);
userRoute.get('/failure', userController.failureLogin);

module.exports = userRoute