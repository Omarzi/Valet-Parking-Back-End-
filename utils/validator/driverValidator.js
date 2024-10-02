const validatorMiddleware = require("../../middleware/validationMiddleware");
const ApiError = require("../../utils/apiError");
const garageSchema = require("../../models/garageModel")
const { check } = require("express-validator");


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

      validatorMiddleware,

],


exports.addNewUserValidator = [
   check("email")
     .notEmpty()
     .withMessage("email is required"),

  check("password")
     .notEmpty()
     .withMessage("password is required"),   
],

exports.takeAttendanceValidator = [
   check("admin")
   .notEmpty()
   .withMessage("admin is required"),

check("lat")
   .notEmpty()
   .withMessage("lat is required"),

check("lng")
   .notEmpty()
   .withMessage("lng is required"),   


]