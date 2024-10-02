const { activeGarage ,addNewUser ,
         takeAttendanceStartIn , takeAttendancesEndIn ,updteOrder , getProfile, makeScan  } = require("../controllers/driverControllers");
const { allowedTo , adminProtect} = require("../controllers/authContollers")
const { addNewUserValidator , takeAttendanceValidator} = require("../utils/validator/driverValidator")
const {getAllOrders, makeOrder, getOrder} = require("../controllers/userContoller")

const router = require("express").Router();



router.put("/activeGarage/:garageId",adminProtect,allowedTo('Driver'),activeGarage)
router.post("/addNewUser", adminProtect,allowedTo('Driver'),addNewUserValidator,addNewUser)
router.get("/getAllOrderBySpecificGarage",adminProtect,allowedTo('Driver'),getAllOrders)
router.put("/updteOrder/:orderId",adminProtect,allowedTo('Driver'),updteOrder)
router.post("/makeScan",adminProtect,allowedTo('Driver'),makeScan)
router.post("/takeAttendanceStartIn", adminProtect,allowedTo('Driver'),takeAttendanceValidator,takeAttendanceStartIn)
router.post("/takeAttendancesEndIn", adminProtect,allowedTo('Driver'),takeAttendanceValidator,takeAttendancesEndIn)
router.get("/getPofileOfAdmin/:adminId",adminProtect,allowedTo('SubOwner','Driver'),getProfile)
router.post("/makeOrder/:userId",adminProtect,allowedTo('Driver'), makeOrder)
router.get("/getOrder/:orderId",adminProtect,allowedTo('Driver'),getOrder)









module.exports = router;

