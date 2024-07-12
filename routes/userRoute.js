const express = require('express')
const userRoute = express()
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const addressController = require('../controllers/addressController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const session = require('express-session')
const userAuth = require('../middlewares/userAuth')
require('dotenv').config
const passport = require('passport')



// home page
userRoute.get('/', userController.showHome)
// login page
userRoute.get('/login', userAuth.isLogout, userController.showLogin)
userRoute.post('/login', userController.verifyLogin)
// signup page
userRoute.get('/signup',userAuth.userAuthorize, userController.showSignUp)
userRoute.post('/signup', userAuth.userAuthorize, userController.insertUser)
// otp
userRoute.get('/otp',userAuth.userAuthorize, userController.showOtp)
userRoute.post('/otp', userAuth.userAuthorize, userController.verifyOtp)
userRoute.get('/resendOtp',userAuth.userAuthorize, userController.resendOtp)
// shop and detail page
userRoute.get('/shop', userController.showShop)
userRoute.get('/shop/lowToHigh',userController.lowToHigh)
userRoute.get('/shop/popularity',userController.popularity)
userRoute.get('/shop/highToLow',userController.HighToLow)
userRoute.get('/shop/latest',userController.latest)
userRoute.get('/shop/category/:name',userController.categoryFiltering)
userRoute.get('/productDetail/:id', userController.showProductDetail)

userRoute.get('/shop/search',userController.searchItems)
// cart
userRoute.get('/cart',userAuth.isLogin, cartController.loadCart)
userRoute.post('/addToCart',userAuth.isLoginn,cartController.addToCart)
userRoute.patch('/cartUpdate',userAuth.isLogin, cartController.updateCart)
userRoute.post('/removeItem',userAuth.isLogin, cartController.removeFromCart)
userRoute.patch('/clearCart',userAuth.isLoginn, cartController.clearCart)
// Profile
userRoute.get('/myAccount',userAuth.isLogin,userAuth.isBlockAuth, userController.loadMyAccount)
userRoute.patch('/editProfile',userAuth.isLoginn, userController.editProfile)
userRoute.get('/orderDetails/:id',userAuth.isLogin, orderController.loadOrderDetails)
userRoute.post('/changePassword',userAuth.isLogin, userController.changePassword)
userRoute.post('/addAddress',userAuth.isLogin, addressController.addAddress)
userRoute.post('/loadEditAddress',userAuth.isLogin, addressController.loadEditAddress)
userRoute.patch('/saveEditAddress',userAuth.isLoginn, addressController.saveEditAddress)
userRoute.patch('/removeAddress',userAuth.isLoginn, addressController.removeAddress)
// Wishlist
userRoute.get('/wishlist',userAuth.isLogin, userController.loadWishlist)
userRoute.patch('/addToWishlist',userAuth.isLoginn, userController.addToWishlist)
userRoute.patch('/removeFromWishlist',userAuth.isLoginn, userController.removeFromWishlist)
//checkout
userRoute.get('/checkout',userAuth.isLogin, cartController.loadCheckout)
userRoute.patch('/checkoutAddAddress',userAuth.isLoginn, addressController.checkoutAddAddress)
// order
userRoute.patch('/validateCoupon',userAuth.isLoginn, couponController.validateCoupon)
userRoute.patch('/applyCoupon',userAuth.isLoginn, couponController.applyCoupon)
userRoute.patch('/removeCoupon',userAuth.isLoginn, couponController.removeCoupon)
userRoute.post('/COD',userAuth.isLoginn, orderController.CODorder)
userRoute.get('/successMessage',userAuth.isLogin, orderController.thankYou)
userRoute.post('/cancelOrder',userAuth.isLoginn, orderController.orderCancellation)
userRoute.post('/returnRequest',userAuth.isLoginn, orderController.returnRequest)
userRoute.patch('/returnOrder',userAuth.isLoginn, orderController.returnOrder)
userRoute.post('/paypal',userAuth.isLoginn, orderController.paypalPayment)
userRoute.get('/paypalsuccess',userAuth.isLogin, orderController.handlePayment)
userRoute.get('/paypalcancel',userAuth.isLogin, orderController.handlePaymenterror)
userRoute.post('/failedPayment',userAuth.isLoginn, orderController.failedPayment)
// invoice
userRoute.get('/getinvoice/:id',userAuth.isLogin, orderController.loadInvoice)

// wallet
userRoute.patch('/addAmount',userAuth.isLoginn, userController.addMoneyToWallet)

// about page
userRoute.get('/aboutUs', userController.loadAbout)

// contact page
userRoute.get('/contactUs', userController.loadContact)

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
        successRedirect: '/googlesuccess',
        failureRedirect: '/failure'
    })
);

userRoute.get('/googlesuccess', userController.successGoogleLogin);
userRoute.get('/failure', userController.failureLogin);

// forgot password
userRoute.get('/forgotPassword',userAuth.isLogout, userController.loadForgotPage)
userRoute.post('/forgotPassword',userAuth.isLogin, userController.forgotPassword)
userRoute.get('/forgotConfirm',userAuth.isLogin, userController.loadNewPass)
userRoute.post('/forgotConfirm',userAuth.isLogin, userController.forgetPassConfirm)

// logout
userRoute.get('/logout',userAuth.isLogin, userController.userLogout)


module.exports = userRoute