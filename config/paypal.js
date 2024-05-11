const paypal = require('paypal-rest-sdk')
require('dotenv').config()

paypal.configure({
    mode : 'sandbox',
    client_id : process.env.PAYPALCLIENTID,
    client_secret : process.env.PAYPALSECRETKEY,
});

module.exports = paypal