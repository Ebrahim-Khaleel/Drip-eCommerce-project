const express = require('express');
const path = require('path');
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');
const session = require('express-session');
const mongoose = require('mongoose');
const logger = require('morgan');
const nocache = require('nocache');
const cors = require('cors');
const passport = require('passport');

require('dotenv').config();
mongoose.connect('mongodb://localhost:27017/DripLuxe')

const app = express();

//view engine setup
app.set('view engine', 'ejs')

// app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(nocache())

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// google
app.use(session({
    resave:false,
    saveUninitialized: true,
    secret: 'SECRET'
    
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', userRoute);
app.use('/admin', adminRoute);


const PORT = process.env.PORT

app.listen(PORT, console.log(`server is running on  http://localhost:${PORT}`))