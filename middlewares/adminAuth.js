const isLogin = async(req, res, next)=>{
    try{
        if(req.session.admin_id){
            next()
        }else{
            if(req.headers['content-type'] === 'application/json'){
                res.status(401).json({ loginRequired: true });
            }else{
                res.redirect('/admin/login')
            }
        }
    }catch(error){
        console.log(error.message);
    }
}

const isLoginn = (req, res, next) => {
    try {
        if (req.session.admin_id) {
            next()
        } else {
            res.json({ loginRequired: true });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async(req, res, next) => {
    try{        
        if(req.session.admin_id){
            res.redirect('/admin/home')
        }else {
            next()
        }
    }catch(error){
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLoginn,
    isLogout
}