const address = require('../models/addressModel')

const addAddress = async(req,res) => {
    try{
        const {name, mobile, pincode, state, streetAddress, locality, city} = req.body
        const { user_id } = req.session

        console.log(name, mobile, pincode, state, streetAddress, locality, city);

        // create a new address object
        const newAddress = new address({
            userId: user_id,
            name: name,
            mobile: mobile,
            pincode: pincode,
            state: state,
            streetAddress: streetAddress,
            locality: locality,
            city: city,
        })

        await newAddress.save()

        res.redirect('/myAccount')

    }catch(error){
        console.log(error.message);
    }
}

const loadEditAddress = async(req,res)=> {
    try{
        const { addressId } = req.body
        const findAddress = await address.findOne({_id:addressId})

        res.json({findAddress})
        
    }catch(error){
        console.log(error.message);
    }
}

const saveEditAddress = async(req,res) => {
    try{
        const { addressId } = req.body
        const {name, mobile, pincode, state, streetAddress, locality, city} = req.body
        const addressUpdated = await address.findOneAndUpdate({_id : addressId},{ $set : {name : name, mobile: mobile, pincode: pincode, state:state, streetAddress: streetAddress, locality: locality, city: city}})

        if(addressUpdated){
            res.json({success:true})
        }

    }catch(error){
        console.log(error.message);
        res.json({error : 'error while updating address'})
    }
}

const removeAddress = async(req,res) => {
    try{
        const { addressId } = req.body
        const removed = await address.findByIdAndDelete({_id : addressId})

        if(removed){
            res.json({success:true})
        }
        
    }catch(error){
        console.log(error.message);
    }
}

module.exports = {
    addAddress,
    loadEditAddress,
    saveEditAddress,
    removeAddress,
}