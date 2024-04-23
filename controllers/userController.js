const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const products = require('../models/productModel');
const address = require('../models/addressModel');
const passport = require('passport');
const googleStrategy = require('passport-google-oauth20').Strategy
require('dotenv').config()


// Loading Home Page
const showHome = async (req, res) => {
    try {
        res.render('users/home')
    } catch (error) {
        console.log(error.message);
    }
}

const showShop = async (req, res) => {
    try {
        const showproducts = await products.find().populate('category')
        res.render('users/shop', { showproducts })
    } catch (error) {
        console.log(error);
    }
}

const showProductDetail = async (req, res) => {
    try {
        const { id } = req.params
        const product = await products.findById(id)
        res.render('users/productDetail', {product})

    } catch (error) {
        console.log(error);
    }
}



// Loading Sign Up Page
const showSignUp = async (req, res) => {
    try {
        res.render('users/signup')
    } catch (error) {
        console.log(error.message);
    }
}

// Securing Password using bcrypt
const securePassword = async (password) => {
    try {
        const hashedPass = await bcrypt.hash(password, 10)
        return hashedPass
    } catch (error) {
        console.log(error.message);
    }
}

const generateOtp = () => Math.floor(1000 + (Math.random() * 9000))

let otpExpiration = null;

// User registeration
const insertUser = async (req, res) => {
    try {

        const { name, email, phone, password } = req.body

        const existingEmail = await User.findOne({email:email})

        if(existingEmail){
            return res.render('users/signup',{emessage:'Email already exists'})
        }

        const encryptPass = await securePassword(password)

        const user = new User({
            name: name,
            email: email,
            phone: phone,
            password: encryptPass,
        })

        const verified = await verifyEmail(user.email, req)

        req.session.userData = user

        console.log('req session userData' + req.session.userData);

        if (user) {
            res.redirect('/otp')
        } else {
            res.render('users/signup', { ermessage: 'invalid' })
            console.log('heree');
        }

    } catch (error) {
        console.log(error.message);
    }
}


const verifyEmail = async (email, req) => {
    try {

        // calling the function generate otp
        const Otp = generateOtp()
        req.session.otp = Otp;
        otpExpiration = Date.now() + 60000;

        //assigning the otp to the otp object
        // otpData.otp = Otp
        // otpData.expiration = Date.now() + 60000

        // Setting SMTP transporter
        const transport = nodemailer.createTransport({
            service: "gmail",

            auth: {
                user: process.env.USEREMAIL,
                pass: process.env.USERPASSWORD
            }
        });

        // Setting Mail Body
        const mailoption = {
            from: 'ebrahimkhaleel02@gmail.com',
            to: email,
            subject: 'For Mail verification',
            html: `<html>
                    <body style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <h1 style="color: #333;">Verify Your Email Address</h1>
                        <p style="color: #555; line-height: 1.5;">Enter the following OTP code to verify your email address. This code will expire in 1 minutes:</p>
                        <p style="font-size: 24px; font-weight: bold; color: #007bff;">${Otp}</p>
                        <p style="color: #555; line-height: 1.5;">If you did not request this verification, please ignore this email.</p>
                    </div>
                    </body>
                    </html>`
        }

        // Sending Mail
        transport.sendMail(mailoption, (err, info) => {
            if (err) {
                console.log(err.message);
            }
            else {
                console.log(`Email has been sent: ${info.messageId}`);
                console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        })

        req.session.otp = Otp

        console.log('generated OTP : ' + Otp);

    } catch (error) {
        console.log(error.message);
    }
}


// Load OTP Page
const showOtp = async (req, res) => {
    try {
        res.render('users/otp')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOtp = async (req, res) => {
    try {
        // user input Otp
        const otpDigits = req.body.Otp
        const userOtp = otpDigits.join('')

        console.log('User inputted OTP : ' + userOtp);

        if (otpExpiration && Date.now() > otpExpiration) {
            delete req.session.otp; // Clear OTP from session
            res.render('users/otp', { emessage: 'OTP expired. Please request a new one.' });
        }

        if (userOtp == req.session.otp) {

            const { name, email, password, phone } = req.session.userData

            const data = await User.create({
                name: name,
                email: email,
                phone: phone,
                password: password
            })

            if (data) {
                req.session.user_id = data._id;
                res.redirect('/')
            }

        } else {
            res.render('users/otp', { wmessage: 'wrong otp' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const resendOtp = async (req, res) => {

    try {
        const newOtp = generateOtp();

        const email = req.session.userData.email
        req.session.otp = newOtp
        otpExpiration = Date.now() + 60000;

        await verifyEmail(email, newOtp)
        console.log('resendOtp : ' + newOtp);

        res.redirect('/otp')

    } catch (error) {
        console.log(error.message);
    }
}

// Load Login Page
const showLogin = async (req, res) => {
    try {
        res.render('users/login')
    } catch (error) {
        console.log(error.message);
    }
}

// ----------- Google login -----------
// const loadAuth = async(req,res)=>{
//     res.render('users/login')
// }

const successGoogleLogin = async(req,res)=>{
    try{
        console.log(req.user);
        res.redirect('/')
    }catch(error){
        console.log(error.message);
    }
}

const failureLogin = async(req,res)=>{
    try{
        res.render('users/login')
    }catch(error){
        console.log(error.message);
    }
}

passport.serializeUser((user, done) => {
    done(null, user);
})
  
passport.deserializeUser((user, done) => {
    done(null, user);
})

passport.use(
    new googleStrategy({
        clientID : process.env.GOOGLECLIENTID,
        clientSecret : process.env.GOOGLECLIENTSECRET,
        callbackURL : "http://localhost:4001/auth/google/callback",
        passReqToCallback : true
    },
    function (request, accessToken, refreshToken, profile, done){
        return done(null, profile)
    }

    )
)


// Verifying User Login
const verifyLogin = async (req, res) => {
    try {
        const { email, password} = req.body

        const userData = await User.findOne({ email: email })

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {

                if(!userData.isBlocked){

                    req.session.user_id = userData._id;
                    console.log(userData);
                    res.redirect('/')

                } else {
                    res.render('users/login', { Lmessage: "Sorry we can't find an account with that email and password" })
                }
                
            } else {
                res.render('users/login', { Pmessage: "Incorrect Passowrd" })
            }
            
        } else {
            res.render('users/login', { Lmessage: "Sorry we can't find an account with that email and password" })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadMyAccount = async (req, res) => {
    try {
        const userId = req.session.user_id
        const userData = await User.findById({ _id: req.session.user_id })
        const addresses = await address.find({userId:userId})
        
        if(userData){
            res.render('users/myAccount',{userData,addresses})
        } else {
            res.redirect('/login')
        }

    } catch (error) {
        console.log(error.message);
    }
}

const editProfile = async(req,res) => {
    try{
        const {name, phone} = req.body
        await User.findOneAndUpdate({_id:req.session.user_id},{$set:{name:name, phone:phone}})
        res.json({success:true})
    }catch(error){
        console.log(error.message);
        res.json({error : 'Error while updating Profile'})
    }
}

const userLogout = async (req, res) => {
    try {
        req.session.destroy()
        console.log('User Logged Out');
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    showHome,
    showShop,
    showSignUp,
    insertUser,
    showOtp,
    verifyOtp,
    resendOtp,
    showLogin,
    verifyLogin,
    verifyEmail,
    showProductDetail,
    loadMyAccount,
    editProfile,
    userLogout,
    successGoogleLogin,
    failureLogin,
}