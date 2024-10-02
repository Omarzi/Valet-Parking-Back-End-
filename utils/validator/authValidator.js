const validatorMiddleware = require("../../middleware/validationMiddleware");
const ApiError = require("../../utils/apiError");
const userSchema = require("../../models/authModel");
const { check } = require("express-validator");

exports.signupValidator = [
  check("username")
    .notEmpty()
    .withMessage("Username is required, Please enter your name."),

  check("email")
    .notEmpty()
    .withMessage("Email is required, Please enter your email.")
    .isEmail()
    .withMessage("This email is invalid")
    .custom(async(val,{req})=>{
        const user = await userSchema.findOne({email:req.body.email})
        if(user){
         throw new Error("This email is already exists")
        }
        return true
       }),

  check("password")
    .notEmpty()
    .withMessage("Password is required, Please enter your password.")
    .isLength({ min: 6 })
    .withMessage("Must be at least 6 characters"),

 check("phone") 
    .notEmpty()
    .withMessage("Phone is required , Please enter your phone Number") 
    .isMobilePhone(['ar-EG','ar-SA'])
    .withMessage("Invalid phone number only accept EG and SA phone number")   
    , 
  check("carName")
    .notEmpty()
    .withMessage("Car name is required, Please enter your car name"),

  check("carNumber")
    .notEmpty()
    .withMessage("Car number is required, Please enter your car number"),

  validatorMiddleware,
],


exports.loginValidator = [
    check("email")
      .notEmpty()
      .withMessage("Email is required , Please enter your email")
      .isEmail()
      .withMessage("This email is invalid"),

    check("password")  
      .notEmpty()
      .withMessage("Password is required, Please enter your password.")
      .isLength({ min: 6 })
      .withMessage("Must be at least 6 characters")
     

     , validatorMiddleware
],


exports.resetPasswordValidator = [

  check("confirmPassword")
    .notEmpty() 
    .withMessage("You must enter confirm password") ,  

  check("newPassword") 
    .notEmpty()
    .withMessage("You must enter password") 
    .isLength({ min: 6 })
    .withMessage("Must be at least 6 characters")
    .custom(async(newPassword,{req})=>{

      //  Verify confirm password //

      if(newPassword !=req.body.confirmPassword){
          throw new Error("Password Does not Match")
      }
      return true;
      
  }) ,


  validatorMiddleware,
     
]


