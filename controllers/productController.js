const product = require('../models/productModel')
const category = require('../models/categoryModel')

const loadProducts = async (req, res) => {
    try {
        const products = await product.find().populate('category')
        const categories = await category.find()
        res.render('admin/products', { products, categories })
    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async (req, res) => {
    try {
        const newProduct = new product({
            name: req.body.name,
            price: req.body.price,
            quantity: req.body.quantity,
            images: req.files.map(file => file.filename),
            description: req.body.description,
            category: req.body.category
        })
        const prodsaved = await newProduct.save()

        if (prodsaved) {
            res.redirect('/admin/products')
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadProducts,
    addProduct,
}