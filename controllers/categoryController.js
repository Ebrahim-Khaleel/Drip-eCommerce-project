const category = require('../models/categoryModel')

const loadCategory = async (req, res) => {
    try {
        const categories = await category.find()
        res.render('admin/category', { categories })
    } catch (error) {
        console.log(error.message);
    }
}

const addCategory = async (req, res) => {
    try {
        const newCate = new category({
            name: req.body.name,
            description: req.body.description,
            isBlocked: false
        })

        await newCate.save()
        res.redirect('/admin/category')

    } catch (error) {
        console.log(error.message);
    }
}

const editCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
        const findingCategory = await category.findOne({ _id: categoryId });
        res.status(200).json({ name: findingCategory.name, description: findingCategory.description });

    } catch (error) {
        console.log(error.message);
    }
}

const editCategoryDone = async (req, res) => {
    try {
        const { categoryId, name, description } = req.body;
        await category.updateOne({ _id: categoryId }, { name: name, description: description })
        res.status(200).json({ status: true });
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadCategory,
    addCategory,
    editCategory,
    editCategoryDone,
}