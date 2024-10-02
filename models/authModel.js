const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
    },

    email: {
      type: String,
      require: true,
    },

    password: {
      type: String,
      require: true,
      minlenght: [6, "too shot password"],
    },

    dateOfBirthDay: {
      type: Date,
    },

    phone: {
      type: String,
      require: true,
    },

    profileImage: String,
    carName: {
      type: String,
      require: true,
    },

    carNumber: {
      type: String,
      require: true,
    },

    carImage: String,

    saved: [{ type: mongoose.Schema.Types.ObjectId, ref: "Garages" }],

    wallet: {
      type: Number,
    },

    role: {
      type: String,
      default: "user",
    },

    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
  },
  { timestamps: true }
);

// userSchema.pre("save", async function(next){
//     this.password = await bcrypt.hash(this.password , 10)
//     next();
// })

// use i create  //
userSchema.post("save", (doc) => {
  if (doc.profileImage && !doc.profileImage.startsWith("http")) {
    const imageUrl = `${process.env.BASE_URL}/profileImage/${doc.profileImage}`;
    doc.profileImage = imageUrl;
  }

  if (doc.carImage && !doc.carImage.startsWith("http")) {
    const imageUrl = `${process.env.BASE_URL}/carImage/${doc.carImage}`;
    doc.carImage = imageUrl;
  }
});

userSchema.post("init", (doc) => {
  if (doc.profileImage && !doc.profileImage.startsWith("http")) {
    const imageUrl = `${process.env.BASE_URL}/profileImage/${doc.profileImage}`;
    doc.profileImage = imageUrl;
  }

  if (doc.carImage && !doc.carImage.startsWith("http")) {
    const imageUrl = `${process.env.BASE_URL}/carImage/${doc.carImage}`;
    doc.carImage = imageUrl;
  }
});

const userModel = mongoose.model("Users", userSchema);

module.exports = userModel;
