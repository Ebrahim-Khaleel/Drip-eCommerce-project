const category = require('../models/categoryModel')


const loadCategory = async (req, res) => {
    try {
        const limit = 4;
        const page = parseInt(req.query.page) || 1
        const skip = (page - 1) * limit;
        const totalCateCount = await category.countDocuments();
        const totalPages = Math.ceil(totalCateCount / limit);

        const categoriesData = await category.find().skip(skip).limit(limit)
        res.render('admin/category', { categories : categoriesData, totalPages, currentPage : page})
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
            
            res.json({alreadyAdded : true})

        } else {

            const newCate = new category({
                name: name,
                description: description,
                isBlocked: false
            })

            const savedCategory = await newCate.save()

            if(savedCategory){
                res.json({added:true})
            }
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
        const existingCategory = await category.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
        if (existingCategory) {
            return res.status(400).json({ error :'Category already exists.'});
        }

        await category.updateOne({ _id: categoryId }, { name: name, description: description })
        res.status(200).json({ success: true });

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