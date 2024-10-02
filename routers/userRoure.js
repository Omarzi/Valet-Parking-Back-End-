
const {getProfile , updateProfile , updatePassword  , getAllGarages ,getSpecificGarage , 
       makeOrder , getOrder ,getAllOrders , cancelOrder , getUserWallet,getAllOrdersForSpecificUser } = require("../controllers/userContoller")
const {getProfileValidator , updateProfileValidator , updatePasswordValidator } = require("../utils/validator/userValidator")
const {protect , allowedTo} = require("../controllers/authContollers")
const {  uploadAuthImage ,resizeImage}= require("../controllers/authContollers")
const {addGarageToSaved , getUserSavedGarage , removeGarageFromSaved} = require("../controllers/savedControllers")

const router = require("express").Router();

router.get("/getProfile/:userId",protect,getProfileValidator, getProfile);
router.put("/updateProfile/:userId",protect,allowedTo('user') , uploadAuthImage ,resizeImage,updateProfileValidator,updateProfile);
router.put("/updatePassword/:userId" ,protect,updatePasswordValidator, updatePassword)
router.get("/getAllGarages",protect ,allowedTo('user'),getAllGarages)
router.get("/getSpecificGarage/:garageId",protect,getSpecificGarage)
router.post("/addGarageToSaved",protect,allowedTo('user'),addGarageToSaved)
router.get("/getUserSavedGarage",protect,allowedTo('user'),getUserSavedGarage)
router.delete("/removeGarageFromSaved" ,protect,allowedTo('user'), removeGarageFromSaved)
router.post("/makeOrder/:userId",protect,allowedTo('user'), makeOrder)
router.get("/getOrder/:orderId",protect,allowedTo('user'),getOrder)
router.get("/getAllOrders",protect,getAllOrders)
router.put("/cancelOrder/:orderId" ,protect,allowedTo('user'), cancelOrder)
router.get("/getUserWallet/:userId",protect,allowedTo('user'),getUserWallet)
router.get("/getAllOrdersForSpecificUser",protect,getAllOrdersForSpecificUser)






module.exports = router;