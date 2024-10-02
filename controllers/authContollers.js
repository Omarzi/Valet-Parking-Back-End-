const userSchema = require("../models/authModel");
const ApiError = require("../utils/apiError");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const moment = require("moment");
const formatDate = require("../middleware/formatDateMiddleware");
const adminSchema = require("../models/adminModel");
const multer = require("multer");

const ownerSchema = require("../models/ownerModel");

const multerStorage = multer.memoryStorage();

const multerFilter = function (req, file, cb) {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images allowed", 404), false);
  }
};

exports.resizeImage = asyncHandler(async (req, res, next) => {
  // Check if both images are uploaded
  if (req.files && req.files.profileImage && req.files.carImage) {
    // Process profileImage
    const profileImageFilename = `profileImage-${uuidv4()}-${Date.now()}.png`;
    await sharp(req.files.profileImage[0].buffer)
      .resize(600, 600)
      .toFormat("png")
      .jpeg({ quality: 90 })
      .toFile(`uploads/profileImage/${profileImageFilename}`);
    req.body.profileImage = profileImageFilename;

    // Process carImage
    const carImageFilename = `carImage-${uuidv4()}-${Date.now()}.png`;
    await sharp(req.files.carImage[0].buffer)
      .resize(600, 600)
      .toFormat("png")
      .jpeg({ quality: 90 })
      .toFile(`uploads/carImage/${carImageFilename}`);
    req.body.carImage = carImageFilename;
  }
  next();
});

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadAuthImage = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "carImage", maxCount: 1 },
]);

// Register
exports.signUp = asyncHandler(async (req, res, next) => {
  const {
    username,
    email,
    password,
    phone,
    profileImage,
    carName,
    carNumber,
    carImage,
  } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await userSchema.create({
    username,
    email,
    password: hashedPassword,
    phone,
    profileImage, // Correctly set the profileImage
    carName,
    carNumber,
    carImage, // Correctly set the carImage
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

  const formattedUser = {
    userId: user._id,
    username: user.username,
    email: user.email,
    password: user.password,
    phone: user.phone,
    profileImage: user.profileImage,
    carName: user.carName,
    carNumber: user.carNumber,
    carImage: user.carImage,
    role: user.role,
    saved: user.saved,
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
  };
  await user.save();

  res.status(200).json({ userData: formattedUser, token });
});

//      Login    //

// exports.login = asyncHandler(async (req, res, next) => {
//     const { email, password } = req.body;

//     // Check if the user exists in userSchema
//     let user = await userSchema.findOne({ email })

//     if (user) {
//         // Compare the provided password with the user's hashed password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             throw new ApiError("Incorrect email or password.", 401);
//         }

//         // Generate JWT token for the user
//         const token = jwt.sign(
//             { userId: user._id, role: 'user' },
//             process.env.JWT_SECRET_KEY,
//             { expiresIn: process.env.JWT_EXPIRE_TIME }
//         );

//         const formattedUser = {
//             userId: user._id,
//             username: user.username,
//             email: user.email,
//             phone: user.phone,
//             profileImage: user.profileImage,
//             carName: user.carName,
//             carNumber: user.carNumber,
//             carImage: user.carImage,
//             role: user.role,
//             saved: user.saved,
//             createdAt: formatDate(user.createdAt),
//             updatedAt: formatDate(user.updatedAt)
//         };

//         return res.status(200).json({ userData: formattedUser, token });
//     }

//     // If the user does not exist in userSchema, check adminSchema
//     let admin = await adminSchema.findOne({ email });
//     if (!admin) {
//         throw new ApiError("Incorrect email or password.", 404);
//     }

//     // Compare the provided password with the admin's hashed password
//     const checkPassword = await bcrypt.compare(password, admin.password);
//     if (!checkPassword) {
//         throw new ApiError("Incorrect email or password.", 404);
//     }

//     // Generate JWT token for the admin
//     const token = jwt.sign(
//         { adminId: admin._id, role: admin.role },
//         process.env.JWT_SECRET_KEY,
//         { expiresIn: process.env.JWT_EXPIRE_TIME }
//     );

//     const formattedAdmin = {
//         adminId: admin._id,
//         email: admin.email,
//         lat: admin.lat,
//         lng: admin.lng,
//         salary: admin.salary,
//         role: admin.role,
//         garage: admin.garage,
//         createdAt: formatDate(admin.createdAt),
//         updatedAt: formatDate(admin.updatedAt)
//     };

//     // Remove sensitive fields from the response
//     delete admin._doc.password;
//     delete admin._doc.__v;

//     res.status(200).json({ adminData: formattedAdmin, token });
// });

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await userSchema.findOne({ email }).populate({
    path: "saved",
    model: "Garages",
    select: "-__v",
  });

  if (!user) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  // Compare the provided password with the hashed password in the database
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Generate reset code
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  console.log(resetCode);

  user.passwordResetCode = hashedResetCode;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes
  user.passwordResetVerified = false;

  await user.save();

  const message = `Hi ${user.username},\nWe received a request to log in to your valet parking account.\nYour reset code is: ${resetCode}\nThis code is valid for 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your login verification code (Valid for 10 min)",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError("There was an error sending the email", 500));
  }

  res.status(200).json({
    status: "Success",
    message: "Reset code sent to email. Please verify the code.",
  });
});

// Middleware to verify the reset code
exports.verifyResetCodeOfLogin = asyncHandler(async (req, res, next) => {
  // Hash the provided reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  // Find the user by the hashed reset code and ensure the reset code hasn't expired
  const user = await userSchema.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If no user found or reset code is expired, send an error
  if (!user) {
    return next(new ApiError("Reset code is invalid or has expired", 404));
  }

  // Mark the reset code as verified and clear the reset code fields
  user.passwordResetVerified = true;
  user.passwordResetCode = undefined; // Clear the reset code
  user.passwordResetExpires = undefined; // Clear the expiration date

  // Save the user to update the changes
  await user.save();

  // Generate a JWT token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

  // Format user details (excluding sensitive information)
  const formattedUser = {
    userId: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    carName: user.carName,
    carNumber: user.carNumber,
    carImage: user.carImage,
    role: user.role,
    saved: user.saved.map((item) => ({
      ...item.toObject(),
      openDate: formatDate(item.openDate),
      endDate: formatDate(item.endDate),
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt),
    })),
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
  };

  // Send the response with the formatted user data and token
  res.status(200).json({
    message: "Login successful",
    userData: formattedUser,
    token,
  });
});

//     Fogot Pssword   ///

// exports.forgotPassword = asyncHandler( async( req , res , next) => {
//     const user = await userSchema.findOne({email : req.body.email})

//     if(!user){
//         return next(new ApiError("There is no user for this email" , 404));
//     }
//         // generate reset code    //
//         const resetCode  = Math.floor(100000 + Math.random() * 900000).toString();
//         const hashedResetCode = crypto
//         .createHash('sha256')
//         .update(resetCode)
//         .digest('hex');

//         user.passwordResetCode = hashedResetCode;
//         user.passwordResetExpires = Date.now() + 10*60*1000
//         user.passwordResetVerified = false;

//         await user.save();

//         // send reset code via email //

//     const message = `Hi ${user.username},\n we receved the request to reset the password
//     on your valet_parking account , \n ${resetCode}\n`

//     try{
//         await sendEmail({
//             email: user.email,
//             subject: 'Your password reset code (Valid for 10 min)',
//             message:message
//         })
//     }
//     catch(err){

//         user.passwordResetCode = undefined,
//         user.passwordResetExpires = undefined,
//         user.passwordResetVerified = undefined;

//         await  user.save();
//         return next(new ApiError('There is an error in sending email',500 ))

//         }
//         res
//           .status(200)
//           .json({status:'Success' ,message:'Reset code send to email' })

// })

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await userSchema.findOne({ email: req.body.email });

  if (!user) {
    return next(new ApiError("There is no user for this email", 404));
  }

  // Generate 4-digit reset code
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  user.passwordResetCode = hashedResetCode;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.passwordResetVerified = false;

  await user.save();

  // Send reset code via email
  const message = `Hi ${user.username},\nWe received a request to reset the password on your Valet Parking account.\nHere is your reset code: ${resetCode}\n(This code is valid for 10 minutes)`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (Valid for 10 minutes)",
      message: message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError("There was an error sending the email", 500));
  }

  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to email" });
});

//       verify Reset code   //

exports.verifyResetCode = asyncHandler(async (req, res, next) => {
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await userSchema.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError(" Reset code invalid or expired", 404));
  }

  user.passwordResetVerified = true;
  await user.save();
  res.status(200).json({ status: "Success" });
});

//     Reset new password   //
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await userSchema.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(` There is no user for this email ${req.body.email}`, 404)
    );
  }
  if (!user.passwordResetVerified) {
    return next(new ApiError(" Reset code not verifird", 404));
  }
  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
  delete user._doc.password && delete user._doc.__v;
  res.status(200).json({ useData: user, token });
});

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiError(
        "You are not login , Please login to get access this route",
        401
      )
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currentUser = await userSchema.findById(decoded.userId);

  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belong to this token does no longer exist",
        401
      )
    );
  }
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );

    // password changed after token created //
    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          "User recently changed his password , please login again...",
          401
        )
      );
    }
  }
  req.user = currentUser;
  next();
});



// Middleware to restrict routes based on user roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['Owner', 'Admin', etc.]
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.adminProtect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiError(
        "You are not login , Please login to get access this route",
        401
      )
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currentUser = await adminSchema.findById(decoded.adminId);

  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belong to this token does no longer exist",
        401
      )
    );
  }
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );

    // password changed after token created //
    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          "User recently changed his password , please login again...",
          401
        )
      );
    }
  }
  req.admin = currentUser;
  next();
});

exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // Ensure req.user is set
    if (!req.user && !req.admin && !req.owner) {
      return next(new ApiError("User is not authenticated", 401));
    }

    // Check if the user's role or admin's role is included in the allowed roles
    const userRole = req.user ? req.user.role : null;
    const adminRole = req.admin ? req.admin.role : null;
    const ownerRole = req.owner ? req.owner.role : null;

    if (
      !roles.includes(userRole) &&
      !roles.includes(adminRole) &&
      !roles.includes(ownerRole)
    ) {
      return next(
        new ApiError("You are not allowed to access this route", 403)
      );
    }

    next();
  });

exports.protectOwner = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiError(
        "You are not login , Please login to get access this route",
        401
      )
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currentOwner = await ownerSchema.findById(decoded.ownerId);

  if (!currentOwner) {
    return next(
      new ApiError(
        "The owner that belong to this token does no longer exist",
        401
      )
    );
  }
  if (currentOwner.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentOwner.passwordChangedAt.getTime() / 1000,
      10
    );

    // password changed after token created //
    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          "Owner recently changed his password , please login again...",
          401
        )
      );
    }
  }
  req.owner = currentOwner;
  next();
});
