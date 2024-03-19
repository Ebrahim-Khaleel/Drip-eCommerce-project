const express = require('express')
const userRoute = express()
const userController = require('../controllers/userController')
const session = require('express-session')
const { isLogin, isLogout } = require('../middlewares/userAuth')
require('dotenv').config
const passport = require('passport')
require('../passport')


userRoute.use(session({
    secret: process.env.sessionSecret,
    resave: true,
    saveUninitialized: true
}))

userRoute.get('/', userController.showHome)
userRoute.get('/login', isLogout, userController.showLogin)
userRoute.post('/login', userController.verifyLogin)
userRoute.get('/myAccount', userController.loadMyAccount)
userRoute.get('/shop', userController.showShop)
userRoute.get('/productDetail/:id', userController.showProductDetail)
userRoute.get('/signup', userController.showSignUp)
userRoute.post('/signup', userController.insertUser)
userRoute.get('/otp', userController.showOtp)
userRoute.post('/otp', userController.verifyOtp)
userRoute.get('/resendOtp', userController.resendOtp)
userRoute.get('/logout', userController.userLogout)

userRoute.use(passport.initialize());
userRoute.use(passport.session());

// google login
userRoute.use(session({
    secret: 'SECRET',
    resave:false,
    saveUninitialized: true
}))

userRoute.get('users/login',userController.loadAuth)

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