const validatorMiddleware = require("../../middleware/validationMiddleware");
const ownerSchema = require("../../models/ownerModel");
const adminSchema = require("../../models/adminModel");
const garageSchema = require('../../models/garageModel');

const { check } = require("express-validator");

exports.signupValidatorInOwner = [
   check("email")
     .notEmpty()
     .withMessage("Email is required, Please enter your email.")
     .isEmail()
     .withMessage("This email is invalid")
     .custom(async(val,{req})=>{
         const owner = await ownerSchema.findOne({email:req.body.email})
         if(owner){
          throw new Error("This email is already exists")
         }
         return true
        }),
 
   check("password")
     .notEmpty()
     .withMessage("Password is required, Please enter your password.")
     .isLength({ min: 6 })
     .withMessage("Must be at least 6 characters"),
 
   validatorMiddleware,
 ],
 
 
 exports.loginValidatorInOwner = [
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

exports.addNewDriverOrSubOwnerValidatot = [
  check("email")
    .notEmpty()
    .withMessage("Email is required, Please enter your email.")
    .isEmail()
    .withMessage("This email is invalid")
    .custom(async(val,{req})=>{
        const user = await adminSchema.findOne({email:req.body.email})
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

  check("lat")
    .notEmpty()
    .withMessage("lat is required"), 
    
  check("lng")
    .notEmpty()
    .withMessage("lng is required"), 

  check("salary")
    .notEmpty()
    .withMessage("salary is required"),  

  check('garage')
    .optional()
    .custom((garageId)=>
      garageSchema.find({_id:{$exists: true ,$in : garageId }})
      .then((result)=>{
         if(result.length<1 || result.length!==garageId.length){

            return Promise.reject(new Error('Invalid garageId Ids'))
         }
      
      })

    )
  ,  
    
  check("role")
    .notEmpty()
    .withMessage("lng is required")  
    ,validatorMiddleware,
  ]
,

exports.addNewGarageValidator = [
  check("gragename")
     .notEmpty()
     .withMessage("gragename is required"),

  check("grageDescription") 
     .notEmpty()
     .withMessage("grageDescription is required"),  

  // check("grageImages") 
  //    .notEmpty()
  //    .withMessage("grageImages is required"),   
     
  check("gragePricePerHoure") 
     .notEmpty()
     .withMessage("gragePricePerHoure is required"),  
  check("lat")
     .notEmpty()
     .withMessage("lat is required"), 
     
  check("lng")
     .notEmpty()
     .withMessage("lng is required"),   
   
  check("openDate")
     .notEmpty()
     .withMessage("openDate is required"), 
     
  check("endDate")
     .notEmpty()
     .withMessage("endDate is required"), 

  // check("driver")
  //    .notEmpty()
  //    .withMessage("driver is required"), 

  // check("subOwner")
    //  .notEmpty()
    //  .withMessage("subOwner is required"),    
    validatorMiddleware,

]
