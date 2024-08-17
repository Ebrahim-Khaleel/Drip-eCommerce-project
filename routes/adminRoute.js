const express = require('express')
const adminRoute = express()
const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const couponController = require('../controllers/couponController')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const session = require('express-session')
const adminAuth = require('../middlewares/adminAuth')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir)
        }
        cb(null, uploadDir)
        // cb(null,path.join(__dirname,'../public/uploads'))
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname
        cb(null, name)
    }
})
const upload = multer({ storage: storage })

adminRoute.use(session({
    secret : process.env.SESSIONSECRET,
    resave: true,
    saveUninitialized : true
}))

// Admin routes
adminRoute.get('/', adminAuth.isLogout , adminController.loadLogin)
adminRoute.post('/login', adminAuth.isLogout, adminController.verifyAdmin)
adminRoute.get('/signup', adminAuth.isLogout, adminController.showSignUp)
adminRoute.post('/signup', adminAuth.isLogout, adminController.insertAdmin)
adminRoute.get('/logout', adminAuth.isLogin, adminController.adminLogout)

// Home Routes
adminRoute.get('/home', adminAuth.isLogin, adminController.loadHome)

// Users routes
adminRoute.get('/users', adminAuth.isLogin,adminController.loadUsers)
adminRoute.patch('/userBlock', adminAuth.isLogin, adminController.userBlocking)

// Category routes
adminRoute.get('/category', adminAuth.isLogin, categoryController.loadCategory)
adminRoute.post('/category', adminAuth.isLoginn, categoryController.addCategory)
adminRoute.post('/editCategory', adminAuth.isLogin, categoryController.editCategory)
adminRoute.patch('/editCategoryDone', adminAuth.isLoginn, categoryController.editCategoryDone)
adminRoute.patch('/categoryBlock', adminAuth.isLogin, categoryController.categoryBlocking)

// Product routes
adminRoute.get('/products', adminAuth.isLogin, productController.loadProducts)
adminRoute.get('/addProducts',adminAuth.isLogin, productController.loadAddProduct)
adminRoute.post('/addProducts', adminAuth.isLogin, upload.array('image'), productController.addProduct)
adminRoute.get('/editProducts', adminAuth.isLogin, productController.loadEditProduct)
adminRoute.post('/editProducts', adminAuth.isLogin, upload.array('image[]'), productController.editProduct)
adminRoute.patch('/unlistProduct',adminAuth.isLogin, productController.unlistingProduct)

// Order routes
adminRoute.get('/orders', adminAuth.isLogin, adminController.loadOrders)
adminRoute.get('/ordersDetails/:id', adminAuth.isLogin, adminController.loadOrdersDetails)
adminRoute.put('/updateOrderStatus', adminAuth.isLoginn, adminController.updateorderstatus)
adminRoute.get('/returnRequest', adminAuth.isLogin, adminController.loadReturnRequets)

// Offer routes
adminRoute.get('/offers', adminAuth.isLogin, adminController.loadOffers)
adminRoute.get('/addOffer', adminAuth.isLogin, adminController.loadAddOffer)
adminRoute.post('/addOffer', adminAuth.isLoginn, adminController.addOffer)
adminRoute.get('/editOffer/:id', adminAuth.isLogin, adminController.loadEditOffer)
adminRoute.post('/editOffer', adminAuth.isLoginn, adminController.editOffer)
adminRoute.patch('/offerDelete', adminAuth.isLogin, adminController.offerDelete)

// Coupon routes
adminRoute.get('/coupons', adminAuth.isLogin, couponController.loadCoupons)
adminRoute.post('/addCoupons', adminAuth.isLogin, couponController.addCoupon)
adminRoute.post('/editCoupons', adminAuth.isLogin, couponController.editCoupon)
adminRoute.patch('/saveEditCoupons', adminAuth.isLoginn, couponController.saveEditCoupon)
adminRoute.patch('/couponDelete', adminAuth.isLogin, couponController.couponDelete)

// Sales Report
adminRoute.get('/salesReport', adminAuth.isLogin, adminController.loadSalesPage)
adminRoute.get('/salesReport/:period', adminAuth.isLogin, adminController.loadReport)
adminRoute.patch('/salesReport/custom', adminAuth.isLoginn, adminController.loadCustomReport)

// Sales Chart
adminRoute.put('/home/monthChart', adminAuth.isLogin, adminController.monthChart)
adminRoute.put('/home/chartYear', adminAuth.isLogin, adminController.chartYear)

adminRoute.get('/invoice', adminAuth.isLogin, adminController.loadInvoice)

module.exports = adminRoute