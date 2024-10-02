
const { type, format } = require('express/lib/response');
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true, 
  },
  
  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garages",
    required: true,
  },
  
  typeOfCar: {
    type: String,
    required: true,
    enum: ["1", "2", "3","4"],
  },
  
  date: {
    type: Date,
    required: false, 
  },
  
  timeRange: {
    start: { type: Date, required: false   }, 
    end: { type: Date, required: false,  }, 
  },
  
  duration: {
    type: Number,
    required: false, 
  },
  
  totalPrice: {
    type: Number,
    required: true, 
    
  },
  
  status: {
    type: String,
    enum: ["completed", "ongoing", "canceled"],
    default: "ongoing",
  },
  
  paymentMethod: {
    type: String,
    enum: ["cash", "wallet","visa"],
    required: true, 
  },
  isPaid : {
    type: Boolean,

  },
  qrCode: {
    type: String,
  },
  startNow : {
    type: Boolean,
    default: true,
  },
  timeLeft : {
    type:Date,
  
  },

}, { timestamps: true }); 

const orderModel = mongoose.model("Orders", orderSchema);

module.exports = orderModel;
