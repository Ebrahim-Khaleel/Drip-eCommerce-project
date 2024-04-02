const express = require('express')
const userRoute = express()
const userController = require('../controllers/userController')
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
// my account page
userRoute.get('/myAccount',isLogin, userController.loadMyAccount)
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