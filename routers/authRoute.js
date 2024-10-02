const { signUp , login ,verifyResetCodeOfLogin, uploadAuthImage ,resizeImage,forgotPassword , verifyResetCode , resetPassword } = require("../controllers/authContollers");
const {signupValidator , loginValidator , resetPasswordValidator} = require("../utils/validator/authValidator")


const router = require("express").Router();

router.post("/signUp" ,uploadAuthImage,resizeImage,signupValidator, signUp);
router.post("/login" ,loginValidator, login);
router.post("/verifyResetCodeOfLogin", verifyResetCodeOfLogin);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyResetCode", verifyResetCode);
router.put("/resetPassword", resetPasswordValidator ,resetPassword);


module.exports = router;