const User = require('../models/userModel')
const admin = require('../models/adminModel')
const order = require('../models/orderModel')
const offer = require('../models/offerModel')
const product = require('../models/productModel')
const category = require('../models/categoryModel')



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
        const ordersCount = await order.countDocuments()
        const usersCount = await User.countDocuments()
        const productsCount = await product.countDocuments()

        // BEST SELLING PRODUCTS
        const bestSellingProducts = await order.aggregate([
            { $match: { 'products.orderStatus': 'Delivered' } },
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.productId',
                    totalQuantity: { $sum: '$products.quantity' },
                    soldCount : { $sum : 1}
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $project: {
                    _id: 1,
                    totalQuantity: 1,
                    soldCount: 1,
                    productDetails: { $arrayElemAt: ['$productDetails', 0] }
                }
            }

        ])

        // console.log(bestSellingProducts);

        // BEST SELLING CATEGORY
        const bestSellingCategory = await order.aggregate([
            { $match: { 'products.orderStatus': 'Delivered' } },
            { $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $group: {
                    _id: '$productDetails.category',
                    totalQuantity: { $sum: '$products.quantity' },
                }
            },
            { $sort: { totalQuantity: -1 } },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            {
                $project: {
                    _id: 1,
                    totalQuantity: 1,
                    categoryName: { $arrayElemAt: ['$categoryDetails.name', 0] }
                }
            }

        ])

        // console.log(bestSellingCategory);

        // TOTAL EARNINGS
        const curntYear = new Date().getFullYear();
  
        const yearEarnings = await order.aggregate([
            
            {
            
            $match: {
    
                orderDate: {
    
                $gte: new Date(`${curntYear - 5}-01-01`),
                $lte: new Date(`${curntYear}-12-31`),
    
                },
                'products.orderStatus' : 'Delivered'
    
            },
    
            },
    
            {
            $group: {
    
                _id: { $year: "$orderDate" },
                totalAmount: { $sum: "$orderAmount" },
    
            },
    
            },
    
            {
            $sort: { _id: 1 },
            },
    
        ]);
        console.log(yearEarnings)

        res.render('admin/home',{ordersCount, yearEarnings, usersCount, productsCount, bestSellingProducts, bestSellingCategory})
    } catch (error) {
        console.log(error.message);
    }
}

const loadSalesPage = async(req, res) => {
    try{
        const period = undefined;
        const currentDate = new Date();
        let startDate, endDate, reports;

        startDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() - currentDate.getDay()
        )

        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate()+7)

        reports = await order.find({orderDate : {$gte : startDate, $lte: endDate}, products: {$elemMatch: {orderStatus : "Delivered"}} }).sort({orderDate:-1})

        res.render('admin/salesReport',{period : period, report : reports})
        
    }catch(error){
        console.log(error.message);
    }
}

// Sales Report
const loadReport = async(req,res) => {
    try{
        const period = req.params.period

        const currentDate = new Date();
        let startDate, endDate, reports;

        switch(period){
            case "weekly" : 

                startDate = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    currentDate.getDate() - currentDate.getDay()
                )

                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate()+7)

                reports = await order.find({orderDate : {$gte : startDate, $lte: endDate}, products: {$elemMatch: {orderStatus : "Delivered"}} }).sort({orderDate:-1})

                res.render('admin/salesReport',{period : period, report : reports})
                break;

            case "monthly" :

                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                endDate = new Date(currentDate.getFullYear(),currentDate.getMonth() + 1, 0);
                
                reports = await order.find({orderDate : {$gte : startDate, $lte : endDate}, products : {$elemMatch: {orderStatus : "Delivered"}} }).sort({orderDate:-1})

                res.render('admin/salesReport',{period : period, report : reports})
                break;

            case "yearly" :

                startDate = new Date(currentDate.getFullYear(), 0 , 1);
                endDate = new Date(currentDate.getFullYear(), 11, 31);

                reports = await order.find({orderDate : {$gte : startDate, $lte : endDate}, products : {$elemMatch: {orderStatus : "Delivered"}} }).sort({orderDate:-1})

                res.render('admin/salesReport',{period : period, report : reports})
                break;
        }
        
    }catch(error){
        console.log(error.message);
    }
}

const loadCustomReport = async(req, res) =>{
    try{
        const {customStartDate} = req.body
        const {customEndDate} = req.body

        const startDate = new Date(customStartDate)
        const endDate = new Date(customEndDate)

        const reports = await order.find({orderDate: {$gte : startDate, $lte : endDate}, products : {$elemMatch: {orderStatus : "Delivered"}} }).sort({orderDate : -1})

        res.json({report : reports});

    }catch(error){
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
        const limit = 6;
        const page = parseInt(req.query.page) || 1
        const skip = (page - 1) * limit;
        const userCount = await User.countDocuments();
        const totalPages = Math.ceil(userCount / limit);

        const usersData = await User.find().skip(skip).limit(limit)

        res.render('admin/users', { users : usersData, currentPage : page ,totalPages})
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
        const limit = 6;
        const page = parseInt(req.query.page) || 1
        const skip = (page - 1) * limit;
        const orderCount = await order.countDocuments();
        const totalPages = Math.ceil(orderCount / limit);

        const orderDatas = await order.find().populate('products.productId').populate('userId').skip(skip).limit(limit).sort({orderDate : -1});

        res.render('admin/orders',{orders : orderDatas, currentPage : page, totalPages})
        
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


const loadReturnRequets = async(req, res) =>{
    try{
        const returnProduct = await order.aggregate([

            {$unwind : "$products"},
            {$match: {"products.orderStatus" : "Return Requested"}},
            {$group : {
                _id : "$products.productId",
                orderId : {$first: "$_id"},
                productId : {$first: "$products.productId"},
                quantity : {$first : "$products.quantity"},
                returnReason : {$first : "$products.returnReason"},
                userId : {$first: "$userId"},
                totalPrice : {$first : "$products.totalPrice"},
                orderDate  : {$first : "$orderDate"}
            }},
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" }
            
        ])
        console.log(returnProduct);
        res.render('admin/returnRequests',{products:returnProduct})
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

const loadAddOffer = async(req, res) =>{
    try{
        const categories = await category.find({})
        const products = await product.find({})

        res.render('admin/addOffer',{categories,products})
    }catch(error){
        console.log(error.message);
    }
}

const addOffer = async(req,res) =>{
    try{
        const {title, percentage, startDate, endDate, category, productt} = req.body.offerDetails

        const existingOffer = await offer.findOne({name : { $regex: new RegExp('^' + title + '$', 'i') } })

        if(existingOffer){
            return res.json({alreadyExist:true})
        }

        const newOfferData = {
            name : title,
            percentage : percentage,
            startDate : startDate,
            endDate : endDate
        }

        if(category){
            newOfferData.category = category;
        }

        if(productt){
            newOfferData.product = productt;
        }

        const newOffer = await offer.create(newOfferData)

        if(category){
            const products = await product.find({category})

            products.forEach(async(prod)=>{
                const offeredPrice = (prod.price * (percentage / 100));
                const offerPrice = prod.price - offeredPrice
                const applied = await product.updateOne({_id:prod._id}, {$set: {offer : newOffer._id, offerPrice : parseFloat(offerPrice.toFixed(2)) } })
                console.log(applied);
            })

        } else if(product){
            const prod = await product.findOne({_id:productt});

            const offeredPrice = (prod.price * (percentage / 100));
            const offerPrice = prod.price - offeredPrice;
            const applied = await product.updateOne({_id:prod._id}, {$set: {offer : newOffer._id, offerPrice : parseFloat(offerPrice.toFixed(2)) } })
            console.log(applied);
        }

        console.log('new offer added')
        res.json({success:true})

    }catch(error){
        console.log(error.message);
    }
}

const loadEditOffer = async(req, res) =>{
    try{
        const offerId = req.params.id
        const offerDetails = await offer.findOne({_id:offerId}).populate('category product')

        let categories = []
        let products = []

        if(offerDetails.category){
            categories = await category.find({});
        } else if (offerDetails.product){
            products = await product.find({});
        }

        res.render('admin/editOffer',{offerDetails, categories, products})
    }catch(error){
        console.log(error.message);
    }
}

const editOffer = async(req,res) =>{
    try{
        const {offerId, title, percentage, startDate, endDate, category, productt} = req.body.offerDetails
        console.log(req.body.offerDetails)
        const existingOffer = await offer.findOne({_id:offerId})
        console.log(existingOffer)
        let previousProducts = [];
        if(existingOffer.category){
            previousProducts = await product.find({category : existingOffer.category})
            console.log(previousProducts);
        } else if (existingOffer.product){
            previousProducts = await product.find({_id:existingOffer.product})
        }

        existingOffer.name = title;
        existingOffer.percentage = percentage;
        existingOffer.startDate = startDate;
        existingOffer.endDate = endDate;

        let updatedProducts = [];
        if(category){
            existingOffer.category = category;
            existingOffer.product = null;

            updatedProducts = await product.find({category})

            for(const prod of updatedProducts){
                const offerPrice = prod.price - (prod.price * (percentage / 100));
                await product.updateOne({ _id: prod._id }, {
                    offer: existingOffer._id,
                    offerPrice: parseFloat(offerPrice.toFixed(2))
                });
            }

        } else if(productt){
            existingOffer.product = productt
            existingOffer.category = null;

            const prod = await product.findOne({_id:productt})
            if (prod) {
                updatedProducts = [prod];
                const offerPrice = prod.price - (prod.price * (percentage / 100));
                await product.updateOne({ _id: prod._id }, {
                    offer: existingOffer._id,
                    offerPrice: parseFloat(offerPrice.toFixed(2))
                });
            }
        }

        const updatedProductIds = updatedProducts.map(prod => prod._id.toString());
        for (const prevProd of previousProducts) {
            if (!updatedProductIds.includes(prevProd._id.toString())) {
                await product.updateOne({ _id: prevProd._id }, {
                    $set: { offerPrice: prevProd.price },
                    $unset:{ offer: ""}
                });
            }
        }

        await existingOffer.save();
        
        res.json({success:true}) 

    }catch(error){
        console.log(error.message);
    }
}


const offerDelete = async(req, res) =>{
    try{
        const {offerId} = req.body

        const offerr = await offer.findOne({_id:offerId}).populate('category product')

        if (offerr.category) {
            const category = offerr.category;
            const products = await product.find({ category });

            for (const prod of products) {
                await product.findOneAndUpdate({ _id: prod._id }, {
                    $set: { offerPrice: prod.price },
                    $unset: { offer: "" }
                });
            }
        } else if (offerr.product) {
            const productt = offerr.product;
            await product.findOneAndUpdate({ _id: productt._id }, {
                $set: { offerPrice: productt.price },
                $unset: { offer: "" }
            });
        }

        const done = await offer.findOneAndDelete({_id:offerId})

        if(done){
            res.json({success:true})
        }
    }catch(error){
        console.log();
    }
}

const loadInvoice = async(req,res) =>{
    try{
        const orders = await order.find({products:{$elemMatch : {orderStatus : "Delivered"}}}).sort({orderDate:-1})
        res.render('admin/invoice',{orders})
    }catch(error){
        console.log(error.message);
    }
}

const chartYear = async (req, res) => {

    try {
  
      const curntYear = new Date().getFullYear();
  
      const yearChart = await order.aggregate([
          
        {
          
          $match: {
  
            orderDate: {
  
              $gte: new Date(`${curntYear - 5}-01-01`),
              $lte: new Date(`${curntYear}-12-31`),
  
            },
            'products.orderStatus' : 'Delivered'
  
          },
  
        },
  
        {
          $group: {
  
            _id: { $year: "$orderDate" },
            totalAmount: { $sum: "$orderAmount" },
  
          },
  
        },
  
        {
          $sort: { _id: 1 },
        },
  
      ]);
      console.log('yeaer:::');
      console.log(yearChart);
      res.send({ yearChart });
  
    }catch(error) {
      console.log(error.message)
    }
  
};
  
const monthChart = async (req, res) => {
  
    try {
      
      const monthName = [
  
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  
      const curntYear = new Date().getFullYear();
  
      const monData = await order.aggregate([
      
        {
          $match: {
  
            orderDate: {
  
              $gte: new Date(`${curntYear}-01-01`),
              $lte: new Date(`${curntYear}-12-31`),
              
            },
            'products.orderStatus' : 'Delivered'
  
          },
        },
  
        {
          $group: {
            _id: { $month: "$orderDate" },
            totalAmount: { $sum: "$orderAmount" },
          },
        },
  
        {
          $sort: { _id: 1 },
        },
  
      ]);
  
      const salesData = Array.from({ length: 12 }, (_, i) => {
  
        const monthData = monData.find((item) => item._id === i + 1);
  
        return monthData ? monthData.totalAmount : 0;
  
      });
      console.log('monthside');
      console.log(salesData);
      res.json({ months: monthName, salesData });
  
    } catch (error) {
  
      console.log(error.message);
  
    }
  
};

module.exports = {
    loadLogin,
    verifyAdmin,
    loadHome,
    loadSalesPage,
    loadReport,
    loadCustomReport,
    loadUsers,
    adminLogout,
    showSignUp,
    insertAdmin,
    userBlocking,
    loadOrders,
    loadOrdersDetails,
    updateorderstatus,
    loadReturnRequets,
    loadOffers,
    addOffer,
    loadEditOffer,
    editOffer,
    loadAddOffer,
    offerDelete,
    loadInvoice,
    chartYear,
    monthChart,
}