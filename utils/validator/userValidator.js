const validatorMiddleware = require("../../middleware/validationMiddleware");
const ApiError = require("../../utils/apiError");
const userSchema = require("../../models/authModel");
const orderSchema = require("../../models/oderModel")
const { check } = require("express-validator");
const bcrypt = require("bcrypt")





exports.getProfileValidator = [
    check("userId")
      .notEmpty()
      .withMessage("userId is required"),

      validatorMiddleware,  
],


exports.updateProfileValidator = [
    check('userId')
       .isMongoId()
       .withMessage("Invalid Users id format")
       .optional(),

    check("email")  
       .isEmail()
       .withMessage("This email is invalid") 
       .optional(),

    check("phone")  
       .isMobilePhone(['ar-EG','ar-KW'])
       .withMessage("Invalid phone number only accept EG and SA phone number")
       .optional()  ,

       validatorMiddleware

],


exports.updatePasswordValidator = [
  check("userId")
    .isMongoId()
    .withMessage("Invalid user id format"),

  check("currentPassword")
    .notEmpty()
    .withMessage("You must enter the current password"),

  check("newPassword")
    .notEmpty()
    .withMessage("You must enter a new password")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),

  check("confirmPassword")
    .notEmpty()
    .withMessage("You must confirm the new password"),

  check("newPassword")
    .custom(async (newPassword, { req }) => {
      const user = await userSchema.findById(req.params.userId);

      if (!user) {
        throw new Error("User not found");
      }

      // 1) Verify current password
      const isCorrectPassword = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isCorrectPassword) {
        throw new Error("Incorrect current password");
      }

      // 2) Verify confirm password matches new password
      if (newPassword !== req.body.confirmPassword) {
        throw new Error("New password and confirm password do not match");
      }

      return true;
    }),

  validatorMiddleware,
];


exports.makeOrderValidate = [
  check("typeOfCar")
    .notEmpty()
    .withMessage("typeOfCar is required"),

  check("garage")
    .notEmpty()
    .withMessage("garageId is required"),

  check("date")
    .notEmpty()
    .withMessage("date is required"),

  check("timeRange")
     .custom(async(val,{req})=>{
        const start = await orderSchema.findOne({timeRanges : req.body.timeRange.start})
        const end = await orderSchema.findOne({timeRanges : req.body.timeRange.end})


        if(start&&end){
         throw new Error("This timeRange is already booked.")
        }
        return true
       }),


  check("duration")
    .notEmpty()
    .withMessage("duration is required"),

  check("totalPrice")
    .notEmpty()
    .withMessage("totalPrice is required"),

  check("paymentMethod")
    .notEmpty()
    .withMessage("paymentMethod is required"),

  check("timeLeft")
    .optional(),

  validatorMiddleware,
];
