const express = require('express');
const path = require('path');
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');
const session = require('express-session');
const logger = require('morgan');
const nocache = require('nocache');
const cors = require('cors');
const passport = require('passport');

// importing env
require('dotenv').config();

// Database connecting
const db = require('./config/dbConnect');
 
db()
.then(()=>{
    console.log('Database Connected successfully')
})
.catch((error)=>{
    console.log('Database connection failed', error);
})

// setting App
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


// setting Routes
app.use('/', userRoute);
app.use('/admin', adminRoute);

// error handing middleware
app.use((err, res, next) => {
    res.status(404).render('users/error-404');
});

// setting port
const PORT = process.env.PORT

app.listen(PORT, console.log(`server is running on  http://localhost:${PORT}`))