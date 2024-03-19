// const passport = require('passport');
// require('dotenv').config()
// const googleStrategy = require('passport-google-oauth20').Strategy

// passport.serializeUser(function (user, done) {
//     done(null, user);
// });

// passport.deserializeUser(function (user, done) {
//     done(null, user);
// });

// passport.use(
//     new googleStrategy({
//         clientID : process.env.Google_Client_ID,
//         clientSecret : process.env.Google_Client_Secret,
//         callbackURL : "http://:localhost:4001/auth/google/callback",
//         passReqToCallback : true
//     },
//     function (req, accessToken, refreshToken, profile, done){
//         return done(null, profile)
//     }
    
// ));