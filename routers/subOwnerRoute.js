// // const{getAttendance   } = require("../controllers/subOwnersControllers");
// const{getAllOrders} = require("../controllers/userContoller");
// const {getProfile} = require("../controllers/driverControllers")

// const {adminProtect , allowedTo} = require("../controllers/authContollers")

// const router = require("express").Router();

// // router.get("/getAttendanceOfCurrentDate",adminProtect,allowedTo('SubOwner'),getAttendance)

// router.get("/getAllOrdersForSpecificTime",adminProtect,allowedTo('SubOwner'),getAllOrders)
// router.get("/getPofileOfAdmin/:adminId",adminProtect,allowedTo('SubOwner','Driver'),getProfile)

// module.exports = router
// const{getAttendance   } = require("../controllers/subOwnersControllers");
const { getAllOrders, getOrder } = require("../controllers/userContoller");
const { getProfile } = require("../controllers/driverControllers");
const {
  getAttendanceStartIn,
  getAttendanceEndIn,
} = require("../controllers/subOwnerController");
const { getAllAdmin } = require("../controllers/ownerControllers");

const { adminProtect, allowedTo } = require("../controllers/authContollers");

const router = require("express").Router();

// router.get("/getAttendanceOfCurrentDate",adminProtect,allowedTo('SubOwner'),getAttendance)

router.get(
  "/getAllOrdersForSpecificTime",
  adminProtect,
  allowedTo("SubOwner"),
  getAllOrders
);
router.get(
  "/getPofileOfAdmin/:adminId",
  adminProtect,
  allowedTo("SubOwner", "Driver"),
  getProfile
);
router.get("/getAttendanceEndIn", getAttendanceEndIn);
router.get("/getAttendanceStartIn", getAttendanceStartIn);
router.get("/getAllAdmin", adminProtect, allowedTo("SubOwner"), getAllAdmin);
router.get("/getAllOrders", adminProtect, allowedTo("SubOwner"), getAllOrders);
router.get("/getOrder/:orderId",adminProtect,allowedTo('SubOwner'),getOrder)

module.exports = router;
