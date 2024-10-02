const { type } = require('express/lib/response');
const mongoose  = require('mongoose')

const attendnceSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.ObjectId,
        ref: "Admin",
        required: true, 
      },

      
    lat: {
        type: 'string',
        // required: true,
    },

    lng: {
        type: 'string',
        // required: true,
    },

    startIn: { 
    type: Date,
    }, 

    endIn: { 
        type: Date,
    }, 

    date: { 
        type: Date,
    },


    status : {
        type:String,
        enum: ["present", "on-time", "late"],
    },
        
    garage: {
        type: mongoose.Schema.ObjectId,
        ref: "Garages",
        required: true, 
      }
    

    
},{timestamps : true})

const attendnceModel = mongoose.model('Attendnce' , attendnceSchema);

module.exports = attendnceModel;




