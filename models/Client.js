const mongoose = require("mongoose")

const clientSchema = mongoose.Schema({
    name:String,
    website:String,
    business:String,
    size:{
        type:String,
        enum:['small','medium','large']
    },
    linkedin:String,
    snov:String,
    remarks:String,
    status:{
        type:String,
        default:"Not mailed"
    },
    people:[{
        name:String,
        email:String,
        post:String,
        status:{
            type:String,
            default:"Not mailed"
        }
    }]
})

module.exports = mongoose.model('Client',clientSchema)