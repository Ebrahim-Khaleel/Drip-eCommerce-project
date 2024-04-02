const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            next()
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect('/myAccount')
        } else {
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}

const userAuthorize = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.render('users/error-404')
        } else {
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout,
    userAuthorize,
}