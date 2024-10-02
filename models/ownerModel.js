const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Ensures unique email addresses
    },
    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
      enum: ["Owner"], // Restricts role to Driver or SubOwner
    },
  },
  { timestamps: true }
);

const ownerModel = mongoose.model('Owner', ownerSchema);

module.exports = ownerModel;
