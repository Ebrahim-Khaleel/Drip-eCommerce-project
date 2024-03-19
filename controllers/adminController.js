const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const admin = require('../models/adminModel')


const loadLogin = async (req, res) => {
    try {
        res.render('admin/login')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyAdmin = async (req, res) => {
    try {
        const {email,password} = req.body

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
        const {email,password} = req.body

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
        res.render('admin/home')
    } catch (error) {
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
        const usersData = await User.find()
        res.render('admin/users', { usersData })
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadLogin,
    verifyAdmin,
    loadHome,
    loadUsers,
    adminLogout,
    showSignUp,
    insertAdmin,
}