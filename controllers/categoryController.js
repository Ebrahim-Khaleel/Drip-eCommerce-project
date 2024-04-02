const { name } = require('ejs');
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
        const { name, description } = req.body

        const lowerCaseName = name.toLowerCase()
        const existingName = await category.findOne({name: { $regex: new RegExp(`^${lowerCaseName}$`, 'i') } })

        if(existingName){
            return res.json({added : false,message:'Category already exists'})
        }

        const newCate = new category({
            name: name,
            description: description,
            isBlocked: false
        })

        const savedCategory = await newCate.save()

        if(savedCategory){
            // res.json({added:true, message : 'Category Added Successfully'})
            res.redirect('/admin/category')
        }

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
        
        // Check if the new name already exists in another category
        const existingCategory = await category.findOne({ name: name, _id: { $ne: categoryId } });
        if (existingCategory) {
        return res.status(400).json({ error: 'Category name already exists. Please choose a different name.' });
        }

        await category.updateOne({ _id: categoryId }, { name: name, description: description })
        res.status(200).json({ status: true });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'An error occurred while updating the category.' });
    }
}

const categoryBlocking = async(req,res)=>{
    try{
        const { categoryId } = req.body
        const categoryData = await category.findOne({ _id : categoryId })

        if(!categoryData.isBlocked){
            await category.findByIdAndUpdate({ _id : categoryId}, {$set: {isBlocked:true}})
            console.log('Category Blocked');
        } else {
            await category.findByIdAndUpdate({ _id : categoryId}, {$set : {isBlocked:false}})
            console.log('Category Unblocked');
        }

        res.json({res:true})

    }catch(error){
        console.log(error.message);
    }
}

module.exports = {
    loadCategory,
    addCategory,
    editCategory,
    editCategoryDone,
    categoryBlocking,
}