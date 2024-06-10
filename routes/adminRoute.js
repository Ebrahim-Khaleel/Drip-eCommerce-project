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
const { isLogin, isLogout } = require('../middlewares/adminAuth')

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
adminRoute.get('/login', isLogout , adminController.loadLogin)
adminRoute.post('/login', adminController.verifyAdmin)
adminRoute.get('/signup', isLogin,adminController.showSignUp)
adminRoute.post('/signup', adminController.insertAdmin)
adminRoute.get('/logout',isLogin,adminController.adminLogout)

// Home Routes
adminRoute.get('/home', isLogin, adminController.loadHome)

// Users routes
adminRoute.get('/users', isLogin,adminController.loadUsers)
adminRoute.patch('/userBlock',adminController.userBlocking)

// Category routes
adminRoute.get('/category',isLogin, categoryController.loadCategory)
adminRoute.post('/category', categoryController.addCategory)
adminRoute.post('/editCategory', categoryController.editCategory)
adminRoute.patch('/editCategoryDone', categoryController.editCategoryDone)
adminRoute.patch('/categoryBlock',categoryController.categoryBlocking)

// Product routes
adminRoute.get('/products', isLogin,productController.loadProducts)
adminRoute.get('/addProducts',isLogin, productController.loadAddProduct)
adminRoute.post('/addProducts', upload.array('image'), productController.addProduct)
adminRoute.get('/editProducts',isLogin, productController.loadEditProduct)
adminRoute.post('/editProducts', upload.array('image[]'), productController.editProduct)
adminRoute.patch('/unlistProduct',productController.unlistingProduct)

// Order routes
adminRoute.get('/orders',adminController.loadOrders)
adminRoute.get('/ordersDetails/:id',adminController.loadOrdersDetails)
adminRoute.put('/updateOrderStatus',adminController.updateorderstatus)
adminRoute.get('/returnRequest',adminController.loadReturnRequets)

// Offer routes
adminRoute.get('/offers',adminController.loadOffers)
// adminRoute.post('/offers',adminController.addOffer)
adminRoute.get('/addOffer',adminController.loadAddOffer)
adminRoute.post('/addOffer',adminController.addOffer)
// adminRoute.post('/editOffer',adminController.editOffer)
// adminRoute.patch('/saveEditOffer',adminController.saveEditOffer)
adminRoute.patch('/offerDelete',adminController.offerDelete)

// Coupon routes
adminRoute.get('/coupons',couponController.loadCoupons)
adminRoute.post('/addCoupons',couponController.addCoupon)
adminRoute.post('/editCoupons',couponController.editCoupon)
adminRoute.patch('/saveEditCoupons',couponController.saveEditCoupon)
adminRoute.patch('/couponDelete',couponController.couponDelete)

// Sales Report
adminRoute.get('/salesReport',adminController.loadSalesPage)
adminRoute.get('/salesReport/:period',adminController.loadReport)
adminRoute.patch('/salesReport/custom',adminController.loadCustomReport)

// Sales Chart
adminRoute.put('/home/monthChart',adminController.monthChart)
adminRoute.put('/home/chartYear',adminController.chartYear)

adminRoute.get('/invoice',adminController.loadInvoice)

module.exports = adminRoute