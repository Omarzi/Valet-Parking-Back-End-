const {protectOwner, allowedTo} = require("../controllers/authContollers")
const {signUpForOwner, loginForOwner, getAllGaragesInOwner} = require("../controllers/ownerController")
const {getAllGarages} = require("../controllers/userContoller")
const { addToWallet , getAttendanceOfCurrentDate ,addNewDriverOrSubOwner ,
          login , addNewGarage,uploadGarageImages ,resizeImage ,updateSpecificGarage , deleteSpecificGarageData , 
          getAllAdmin, getAllUsers , updataAdminData , removeSpecificAdmin ,verifyResetCode} = require("../controllers/ownerControllers")
const {addNewDriverOrSubOwnerValidatot ,addNewGarageValidator} = require("../utils/validator/ownerValidator")
const {loginValidator} = require("../utils/validator/authValidator")
const {loginValidatorInOwner, signupValidatorInOwner} = require("../utils/validator/ownerValidator")

const router = require("express").Router();


router.post("/signUpWithOwner" ,signupValidatorInOwner, signUpForOwner);
router.post("/loginWithOwner" ,loginValidatorInOwner, loginForOwner);
router.post("/addToWallet/:userId", protectOwner, allowedTo('Owner'),addToWallet)
router.get("/getAttendanceOfCurrentDate",protectOwner, allowedTo('Owner'),getAttendanceOfCurrentDate)
router.post("/addNewDriverOrSubOwner", protectOwner, allowedTo('Owner'),addNewDriverOrSubOwnerValidatot,addNewDriverOrSubOwner)
router.post("/login",loginValidator,login)
router.post("/verifyResetCode",verifyResetCode)
router.post("/addNewGarage", protectOwner, allowedTo('Owner'),uploadGarageImages,resizeImage,addNewGarageValidator, addNewGarage)
router.put("/updateSpecificGarage/:garageId",protectOwner, allowedTo('Owner'),uploadGarageImages,resizeImage,updateSpecificGarage)
router.delete("/deleteSpecificGarageData/:garageId",protectOwner, allowedTo('Owner') ,deleteSpecificGarageData)
router.get("/getAllAdmin",protectOwner, allowedTo('Owner'),getAllAdmin)
router.get("/getAllUsers",protectOwner, allowedTo('Owner'),getAllUsers)
router.put("/updataAdminData/:adminId", protectOwner, allowedTo('Owner'),updataAdminData)
router.delete("/removeSpecificAdmin/:adminId", protectOwner, allowedTo('Owner'),removeSpecificAdmin)
router.get("/getAllGaragesInOwner",protectOwner,allowedTo('Owner') ,getAllGaragesInOwner)



module.exports = router;

