const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const userSchema = require("../models/authModel");
const attendnceSchema = require("../models/attendanceModel");
const adminSchema = require("../models/adminModel");
const garageSchema = require("../models/garageModel");
const formatDate = require("../middleware/formatDateMiddleware");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const sendEmail = require("../utils/sendEmail");
const userModel = require("../models/authModel");
const multerStorage = multer.memoryStorage();

const multerFilter = function (req, file, cb) {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images allowed", 400), false);
  }
};

exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body.garageImages = []; // Initialize as an empty array

    const uploadDir = path.join(__dirname, "..", "uploads", "garageImages");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await Promise.all(
      req.files.map(async (img, index) => {
        const imageName = `garageImages-${index + 1}.jpeg`;
        const imagePath = path.join(uploadDir, imageName);

        try {
          // Resize and save the image
          await sharp(img.buffer)
            .resize(600, 600)
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(imagePath);

          // Push the relative path or filename to garageImages
          req.body.garageImages.push(imageName);
        } catch (error) {
          console.error(`Error processing image ${imageName}:`, error);
          return next(
            new ApiError(`Failed to process image ${imageName}`, 500)
          );
        }
      })
    );

    next(); // Proceed to the next middleware or route handler
  } else {
    next(); // No images to process, proceed to the next middleware or route handler
  }
});

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Correctly set the field name and maxCount based on your requirements
exports.uploadGarageImages = upload.array("garageImages", 5);

//  Add To Wallet //
exports.addToWallet = asyncHandler(async (req, res, next) => {
  // Find the user by ID
  const user = await userSchema.findById(req.params.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if the user has an existing wallet amount
  let newWalletAmount;
  if (user.wallet) {
    // If user has existing wallet data, add the new amount
    newWalletAmount = user.wallet + req.body.wallet;
  } else {
    // If user does not have wallet data, set it to the new amount
    newWalletAmount = req.body.wallet;
  }

  // Update the user with the new wallet amount
  const updatedUser = await userSchema.findByIdAndUpdate(
    req.params.userId,
    { wallet: newWalletAmount },
    { new: true } // Return the updated document
  );

  if (!updatedUser) {
    return res.status(500).json({ message: "Error updating wallet" });
  }

  // Send the updated wallet amount as response
  res.status(200).json({ data: updatedUser.wallet });
});

exports.getAttendanceOfCurrentDate = asyncHandler(async (req, res, next) => {
  // Get today's date in UTC
  const today = moment().startOf("day").toDate(); // Start of today
  const endOfToday = moment().endOf("day").toDate(); // End of today

  // Query for attendance records within today's date range
  const attend = await attendnceSchema
    .find({
      startIn: { $gte: today, $lte: endOfToday },
    })
    .populate("garage")
    .populate("admin");

  if (attend.length > 0) {
    // Format the dates
    const formattedAttend = attend.map((record) => ({
      attendanceId: record._id.toString(), // Convert ObjectId to string
      lat: record.lat,
      lng: record.lng,
      garage: record.garage
        ? {
            garageId: record.garage._id.toString(),
            garageName: record.garage.gragename,
            garageDescription: record.garage.grageDescription,
            garageImages: record.garage.garageImages,
            pricePerHour: record.garage.gragePricePerHoure,
            lat: record.garage.lat,
            lng: record.garage.lng,
            openDate: formatDate(record.garage.openDate),
            endDate: formatDate(record.garage.endDate),
            active: record.garage.active,
            drivers: record.garage.driver, // Drivers IDs array
            subOwners: record.garage.subOwner, // Sub-owners IDs array
            isSaved: record.garage.isSaved,
          }
        : null,
      driver: record.admin // Admin is used for driver reference
        ? {
            driverId: record.admin._id.toString(),
            email: record.admin.email,
            lat: record.admin.lat,
            lng: record.admin.lng,
            salary: record.admin.salary,
            role: record.admin.role,
            passwordChangedAt: formatDate(record.admin.passwordChangedAt),
          }
        : null,
      startIn: formatDate(record.startIn),
      endtIn: formatDate(record.endIn),
      createdAt: formatDate(record.createdAt),
      updatedAt: formatDate(record.updatedAt),
    }));

    res.status(200).json({
      status: "Success",
      attend: formattedAttend,
    });
  } else {
    res.status(200).json({
      message: "No attendance records found for today",
    });
  }
});

// Helper function to format dates
// function formatDate(date) {
//   return date ? moment(date).format("YYYY-MM-DD hh:mm A") : "Invalid date";
// }

//                  Add New Driver or sub owner            //

// exports.addNewDriverOrSubOwner = asyncHandler(async (req, res, next) => {
//   const hashedPassword = await bcrypt.hash(req.body.password, 10);

//   // Create the new driver or subowner
//   const admin = await adminSchema.create({
//     email: req.body.email,
//     password: hashedPassword,
//     lat: req.body.lat,
//     lng: req.body.lng,
//     salary: req.body.salary,
//     role: req.body.role,
//     garage: req.body.garage,
//   });

//   // Populate the garage field for the admin
//   const populatedAdmin = await admin.populate({
//     path: "garage",
//     model: "Garages",
//     select: "-__v -driver -subowner",
//   });

//   const formattedAdmin = {
//     adminId: populatedAdmin.id,
//     email: populatedAdmin.email,
//     password: hashedPassword,
//     lat: populatedAdmin.lat,
//     lng: populatedAdmin.lng,
//     salary: populatedAdmin.salary,
//     role: populatedAdmin.role,
//     garage: admin.garage.map((garage) => ({
//       garageId: garage._id, // Assign _id to garageId
//       garageImages: garage.garageImages || [], // Ensure garageImages is always an array
//       gragename: garage.gragename,
//       grageDescription: garage.grageDescription,
//       grageImages: garage.grageImages || "", // Ensure grageImages is a string
//       gragePricePerHoure: garage.gragePricePerHoure,
//       lat: garage.lat,
//       lng: garage.lng,
//       openDate: garage.openDate,
//       endDate: garage.endDate,
//       active: garage.active,
//       createdAt: formatDate(garage.createdAt), // Format createdAt field
//       updatedAt: formatDate(garage.updatedAt), // Format updatedAt field
//     })),
//     createdAt: formatDate(populatedAdmin.createdAt),
//     updatedAt: formatDate(populatedAdmin.updatedAt),
//   };

//   // Update the corresponding garage to add the driver or subowner
//   await garageSchema.findByIdAndUpdate(
//     req.body.garage,
//     {
//       $push:
//         req.body.role === "Driver"
//           ? { driver: admin._id }
//           : { subOwner: admin._id },
//     },
//     { new: true }
//   );

//   // Generate token
//   const token = jwt.sign(
//     {
//       adminId: admin.id,
//       role: admin.role,
//     },
//     process.env.JWT_SECRET_KEY,
//     {
//       expiresIn: process.env.JWT_EXPIRE_TIME,
//     }
//   );

//   res.status(200).json({ formattedAdmin, token });
// });
exports.addNewDriverOrSubOwner = asyncHandler(async (req, res, next) => {
  const { role, garage } = req.body;

  // Check if role is 'Driver' and the garage length is not equal to 1
  // if (role === "Driver" && (!garage || garage.length !== 1)) {
  //   return next(new ApiError("A driver must be assigned exactly one garage.", 422));
  // }

  // // Check if role is 'SubOwner' and the garage length is not greater than 1
  // if (role === "SubOwner" && (!garage || garage.length <= 1)) {
  //   return next(new ApiError("A sub-owner must be assigned more than one garage.", 422));
  // }

  // Hash the password
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  // Create the new driver or subowner
  const admin = await adminSchema.create({
    email: req.body.email,
    password: hashedPassword,
    lat: req.body.lat,
    lng: req.body.lng,
    salary: req.body.salary,
    role: req.body.role,
    garage: req.body.garage,
  });

  // Populate the garage field for the admin
  const populatedAdmin = await admin.populate({
    path: "garage",
    model: "Garages",
    select: "-__v -driver -subowner",
  });

  // Format the admin response
  const formattedAdmin = {
    adminId: populatedAdmin.id,
    email: populatedAdmin.email,
    password: hashedPassword,
    lat: populatedAdmin.lat,
    lng: populatedAdmin.lng,
    salary: populatedAdmin.salary,
    role: populatedAdmin.role,
    garage: admin.garage.map((garage) => ({
      garageId: garage._id, // Assign _id to garageId
      garageImages: garage.garageImages || [], // Ensure garageImages is always an array
      gragename: garage.gragename,
      grageDescription: garage.grageDescription,
      grageImages: garage.grageImages || "", // Ensure grageImages is a string
      gragePricePerHoure: garage.gragePricePerHoure,
      lat: garage.lat,
      lng: garage.lng,
      openDate: garage.openDate,
      endDate: garage.endDate,
      active: garage.active,
      createdAt: formatDate(garage.createdAt), // Format createdAt field
      updatedAt: formatDate(garage.updatedAt), // Format updatedAt field
    })),
    createdAt: formatDate(populatedAdmin.createdAt),
    updatedAt: formatDate(populatedAdmin.updatedAt),
  };

  // Update the corresponding garage to add the driver or subowner
  await garageSchema.findByIdAndUpdate(
    req.body.garage,
    {
      $push:
        role === "Driver" ? { driver: admin._id } : { subOwner: admin._id },
    },
    { new: true }
  );

  // Generate token
  const token = jwt.sign(
    {
      adminId: admin.id,
      role: admin.role,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRE_TIME,
    }
  );

  res.status(200).json({ formattedAdmin, token });
});

//              login Driver or sub owner       //

// exports.login = asyncHandler(async (req,res,next) => {
//     const admin = await adminSchema.findOne({email : req.body.email})

//     if(!admin){
//          throw new ApiError("Incorrect email or password .",404)
//     }
//     else {

//         const checkPassword = await bcrypt.compare(req.body.password , admin.password)
//         if(!checkPassword){
//             throw new ApiError("Incorrect email or password .",404)
//         }
//         else {
//             const token =jwt.sign({
//                 adminId : admin.id,
//                 role:req.body.role              },
//                 process.env.JWT_SECRET_KEY,
//                 {expiresIn : process.env.JWT_EXPIRE_TIME}

//                 )
//                 const formattedAdmin = {
//                     adminId: admin.id,
//                     email: admin.email,
//                     password: admin.password,
//                     lat: admin.lat,
//                     lng: admin.lng,
//                     salary:admin.salary,
//                     role: admin.role,
//                     garage: admin.garage,
//                     createdAt: formatDate(admin.createdAt),
//                     updatedAt: formatDate(admin.updatedAt)
//                 }

//                 delete admin._doc.password && delete admin._doc.__v
//                 res.status(200).json({adminData :formattedAdmin , token})
//         }

//     }

// })
// Adjust the path as needed

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if user exists in adminSchema
  const admin = await adminSchema.findOne({ email });
  if (!admin) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  // Compare the provided password with the hashed password in the database
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Generate 4-digit reset code
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Set reset code and expiration
  admin.passwordResetCode = hashedResetCode;
  admin.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  admin.passwordResetVerified = false;

  await admin.save();

  // Email content
  const message = `Hi ${admin.email},\nWe received a request to log in to your account.\nYour reset code is: ${resetCode}\nThis code is valid for 10 minutes.`;

  console.log(resetCode);

  try {
    await sendEmail({
      email: admin.email,
      subject: "Your login verification code (Valid for 10 min)",
      message,
    });
  } catch (err) {
    // If email sending fails, clear reset code and expiration
    admin.passwordResetCode = undefined;
    admin.passwordResetExpires = undefined;
    admin.passwordResetVerified = undefined;

    await admin.save();
    return next(new ApiError("There was an error sending the email", 500));
  }

  res.status(200).json({
    status: "Success",
    message: "Reset code sent to email. Please verify the code.",
  });
});

// exports.verifyResetCode = asyncHandler(async (req, res, next) => {
//   // Hash the provided reset code
//   const hashedResetCode = crypto
//     .createHash("sha256")
//     .update(req.body.resetCode)
//     .digest("hex");

//   // Find the user by the hashed reset code and ensure the reset code hasn't expired
//   const admin = await adminSchema.findOne({
//     passwordResetCode: hashedResetCode,
//     passwordResetExpires: { $gt: Date.now() },
//   });

//   // If no user found or reset code is expired, send an error
//   if (!admin) {
//     return next(new ApiError("Reset code is invalid or has expired", 404));
//   }

//   // Mark the reset code as verified and clear the reset code fields
//   admin.passwordResetVerified = true;
//   admin.passwordResetCode = undefined; // Clear the reset code
//   admin.passwordResetExpires = undefined; // Clear the expiration date

//   // Save the user to update the changes
//   await admin.save();

//   // Generate a JWT token
//   const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET_KEY, {
//     expiresIn: process.env.JWT_EXPIRE_TIME,
//   });

//   // Map the garage data
//   const garageData = admin.garage.map((garage) => ({
//     garageId: garage._id, // Assign _id to garageId
//     garageImages: garage.garageImages || [], // Ensure garageImages is always an array
//     gragename: garage.gragename,
//     grageDescription: garage.grageDescription, // Ensure grageImages is a string
//     gragePricePerHoure: garage.gragePricePerHoure,
//     lat: garage.lat,
//     lng: garage.lng,
//     openDate: garage.openDate,
//     endDate: garage.endDate,
//     active: garage.active,
//     createdAt: formatDate(garage.createdAt), // Format createdAt field
//     updatedAt: formatDate(garage.updatedAt), // Format updatedAt field
//   }));

//   // Format user details (excluding sensitive information)
//   const formattedAdmin = {
//     adminId: admin._id,
//     email: admin.email,
//     lat: admin.lat,
//     lng: admin.lng,
//     salary: admin.salary,
//     role: admin.role,
//     // garage: admin.garage.map((garage) => ({
//     //   garageId: garage._id, // Assign _id to garageId
//     //   garageImages: garage.garageImages || [], // Ensure garageImages is always an array
//     //   gragename: garage.gragename,
//     //   grageDescription: garage.grageDescription, // Ensure grageImages is a string
//     //   gragePricePerHoure: garage.gragePricePerHoure,
//     //   lat: garage.lat,
//     //   lng: garage.lng,
//     //   openDate: garage.openDate,
//     //   endDate: garage.endDate,
//     //   active: garage.active,
//     //   createdAt: formatDate(garage.createdAt), // Format createdAt field
//     //   updatedAt: formatDate(garage.updatedAt), // Format updatedAt field
//     // })),
//     garage: garageData.length === 1 ? garageData[0] : garageData, // Return object if length is 1, otherwise list

//     createdAt: formatDate(admin.createdAt),
//     updatedAt: formatDate(admin.updatedAt),
//   };

//   // Remove sensitive fields from the response
//   delete admin._doc.password;
//   delete admin._doc.__v;

//   res.status(200).json({
//     message: "Reset code verified successfully",
//     adminData: formattedAdmin,
//     token,
//   });
// });

exports.verifyResetCode = asyncHandler(async (req, res, next) => {
  // Hash the provided reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  // Find the admin and populate the garage
  const admin = await adminSchema
    .findOne({
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    })
    .populate("garage"); // Correct population

  if (!admin) {
    return next(new ApiError("Reset code is invalid or has expired", 404));
  }

  // Mark the reset code as verified and clear the reset code fields
  admin.passwordResetVerified = true;
  admin.passwordResetCode = undefined;
  admin.passwordResetExpires = undefined;

  await admin.save();

  // Generate a JWT token
  const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

  // Map the garage data
  const garageData = admin.garage.map((garage) => ({
    garageId: garage._id,
    garageImages: garage.garageImages || [],
    gragename: garage.gragename,
    grageDescription: garage.grageDescription,
    gragePricePerHoure: garage.gragePricePerHoure,
    lat: garage.lat,
    lng: garage.lng,
    openDate: garage.openDate,
    endDate: garage.endDate,
    active: garage.active,
    createdAt: formatDate(garage.createdAt),
    updatedAt: formatDate(garage.updatedAt),
  }));

  const formattedAdmin = {
    adminId: admin._id,
    email: admin.email,
    lat: admin.lat,
    lng: admin.lng,
    salary: admin.salary,
    role: admin.role,
    garage: garageData.length === 1 ? garageData[0] : garageData,
    createdAt: formatDate(admin.createdAt),
    updatedAt: formatDate(admin.updatedAt),
  };

  delete admin._doc.password;
  delete admin._doc.__v;

  res.status(200).json({
    message: "Reset code verified successfully",
    adminData: formattedAdmin,
    token,
  });
});

// const formattedAdmin = {
//   adminId: admin._id,
//   email: admin.email,
//   lat: admin.lat,
//   lng: admin.lng,
//   salary: admin.salary,
//   role: admin.role,
//   garage: admin.garage,
//   createdAt: formatDate(admin.createdAt),
//   updatedAt: formatDate(admin.updatedAt)
// };

// // Remove sensitive fields from the response
// delete admin._doc.password;
// delete admin._doc.__v;

// res.status(200).json({
//   message: 'Reset code verified successfully',
//   adminData: formattedAdmin,
//   token
// });

//  Post Details of garage  //
exports.addNewGarage = asyncHandler(async (req, res, next) => {
  const {
    gragename,
    grageDescription,
    gragePricePerHoure,
    lat,
    lng,
    openDate,
    endDate,
    active,
    driver,
    subOwner,
  } = req.body;

  // Helper function to convert time string (e.g., "8:00 AM") into a Date object
  const parseTimeStringToDate = (timeString) => {
    const [time, modifier] = timeString.split(" ");
    const [hours, minutes] = time.split(":");
    let hours24 = parseInt(hours, 10);

    // Adjust for AM/PM format
    if (modifier === "PM" && hours24 < 12) {
      hours24 += 12;
    } else if (modifier === "AM" && hours24 === 12) {
      hours24 = 0; // Midnight case
    }

    // Create a new Date object using the current date and the parsed time
    const today = new Date();
    today.setHours(hours24);
    today.setMinutes(parseInt(minutes, 10));
    today.setSeconds(0);
    today.setMilliseconds(0);

    return today;
  };

  // Helper function to format Date object into "hh:mm AM/PM"
  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // If the hour is 0, set it to 12 (for midnight or noon)
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return hours + ":" + minutesStr + " " + ampm;
  };

  try {
    // Parse openDate and endDate strings into Date objects
    const parsedOpenDate = parseTimeStringToDate(openDate);
    const parsedEndDate = parseTimeStringToDate(endDate);

    // Check if the garage already exists by name and location
    const findGarage = await garageSchema.findOne({ gragename, lat, lng });

    if (findGarage) {
      return next(new ApiError("This garage already exists", 404));
    }

    // Create the garage
    const newGarage = await garageSchema.create({
      gragename,
      grageDescription,
      garageImages: req.body.garageImages,
      gragePricePerHoure,
      lat,
      lng,
      openDate: parsedOpenDate, // Store the parsed Date object
      endDate: parsedEndDate, // Store the parsed Date object
      active,
      driver,
      subOwner,
    });

    // Add the garage to the respective driver and subOwner
    await adminSchema.findByIdAndUpdate(driver, {
      $push: { garage: newGarage._id },
    });
    await adminSchema.findByIdAndUpdate(subOwner, {
      $push: { garage: newGarage._id },
    });

    const populatedGarage = await garageSchema
      .findById(newGarage._id)
      .populate([
        {
          path: "driver",
          model: "Admin",
          select: "-__v -garage",
        },
        {
          path: "subOwner",
          model: "Admin",
          select: "-__v -garage",
        },
      ]);

    const formattedGarage = {
      garageId: populatedGarage._id.toString(),
      gragename: populatedGarage.gragename || "",
      grageDescription: populatedGarage.grageDescription || "",
      garageImages: populatedGarage.garageImages || "",
      gragePricePerHoure: populatedGarage.gragePricePerHoure || 0,
      lat: populatedGarage.lat || 0,
      lng: populatedGarage.lng || 0,
      openDate: formatTime(parsedOpenDate), // Format openDate as "hh:mm AM/PM"
      endDate: formatTime(parsedEndDate), // Format endDate as "hh:mm AM/PM"
      active: populatedGarage.active || false,
      driver: populatedGarage.driver || [],
      subOwner: populatedGarage.subOwner || [],
      createdAt: formatTime(new Date(populatedGarage.createdAt)),
      updatedAt: formatTime(new Date(populatedGarage.updatedAt)),
    };

    res.status(200).json({
      status: "Success",
      message: "Garage successfully created",
      garageDetails: formattedGarage,
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error creating garage:", error);

    // Send detailed error message
    res.status(500).json({
      status: "error",
      message: `Error creating garage: ${error.message || error}`,
    });
  }
});

// exports.addNewGarage = asyncHandler(async (req, res, next) => {
//   const {
//     gragename,
//     grageDescription,
//     gragePricePerHoure,
//     lat,
//     lng,
//     openDate,
//     endDate,
//     active,
//     driver,
//     subOwner,
//   } = req.body;

//   // Check if the garage already exists by name and location
//   const findGarage = await garageSchema.findOne({ gragename, lat, lng });

//   if (findGarage) {
//     return next(new ApiError("This garage already exists", 404));
//   }

//   // Create the garage
//   const newGarage = await garageSchema.create({
//     gragename,
//     grageDescription,
//     garageImages: req.body.garageImages,
//     gragePricePerHoure,
//     lat,
//     lng,
//     openDate,
//     endDate,
//     active,
//     driver,
//     subOwner,
//   });

//   // Add the garage to the respective driver and subOwner
//   await adminSchema.findByIdAndUpdate(driver, {
//     $push: { garage: newGarage._id },
//   });
//   await adminSchema.findByIdAndUpdate(subOwner, {
//     $push: { garage: newGarage._id },
//   });

//   const populatedGarage = await garageSchema.findById(newGarage._id).populate([
//     {
//       path: "driver",
//       model: "Admin",
//       select: "-__v -garage",
//     },
//     {
//       path: "subOwner",
//       model: "Admin",
//       select: "-__v -garage",
//     },
//   ]);

//   const formattedGarage = {
//     garageId: populatedGarage._id.toString(),
//     gragename: populatedGarage.gragename || "",
//     grageDescription: populatedGarage.grageDescription || "",
//     garageImages: populatedGarage.garageImages || "",
//     gragePricePerHoure: populatedGarage.gragePricePerHoure || 0,
//     lat: populatedGarage.lat || 0,
//     lng: populatedGarage.lng || 0,
//     openDate: formatDate(populatedGarage.openDate),
//     endDate: formatDate(populatedGarage.endDate),
//     active: populatedGarage.active || false,
//     driver: populatedGarage.driver || [],
//     subOwner: populatedGarage.subOwner || [],
//     createdAt: formatDate(populatedGarage.createdAt),
//     updatedAt: formatDate(populatedGarage.updatedAt),
//   };

//   res.status(200).json({
//     status: "Success",
//     message: "Garage successfully created",
//     garageDetails: formattedGarage,
//   });
// });

//           Update  Specific  Garage Data         //

exports.updateSpecificGarage = asyncHandler(async (req, res, next) => {
  const {
    gragename,
    grageDescription,
    grageImages,
    gragePricePerHoure,
    lat,
    lng,
    openDate,
    endDate,
    active,
    driver,
    subowner,
  } = req.body;

  const garage = await garageSchema.findByIdAndUpdate(
    req.params.garageId,
    {
      gragename,
      grageDescription,
      grageImages,
      gragePricePerHoure,
      lat,
      lng,
      openDate,
      endDate,
      active,
      driver,
      subowner,
    },
    { new: true }
  );

  if (!garage) {
    return next(
      new ApiError(
        `Could not find any garage for this garage id ${req.params.garageId}`,
        404
      )
    );
  } else {
    const populatedGarage = await garageSchema.findById(garage._id).populate([
      {
        path: "driver",
        model: "Admin",
        select: "-__v -garage",
      },
      {
        path: "subOwner",
        model: "Admin",
        select: "-__v -garage",
      },
    ]);

    const formattedGarage = {
      garageId: populatedGarage._id.toString(),
      gragename: populatedGarage.gragename || "",
      grageDescription: populatedGarage.grageDescription || "",
      grageImages: populatedGarage.grageImages || "",
      gragePricePerHoure: populatedGarage.gragePricePerHoure || 0,
      lat: populatedGarage.lat || 0,
      lng: populatedGarage.lng || 0,
      openDate: formatDate(populatedGarage.openDate),
      endDate: formatDate(populatedGarage.endDate),
      active: populatedGarage.active || false,
      driver: populatedGarage.driver || [],
      subOwner: populatedGarage.subOwner || [],
      createdAt: formatDate(populatedGarage.createdAt),
      updatedAt: formatDate(populatedGarage.updatedAt),
    };

    res.status(200).json({
      status: "Success",
      message: "Garage successfully created",
      garageDetails: formattedGarage,
    });
  }
});

//           Delet Specific  Garage Data         //

exports.deleteSpecificGarageData = asyncHandler(async (req, res, next) => {
  const garage = await garageSchema.findByIdAndDelete(req.params.garageId);

  if (!garage) {
    return next(
      new ApiError(
        `Could not find any garage for this garage id ${req.params.garageId}`,
        404
      )
    );
  } else {
    res.status(200).json("Garage deleated successfully");
  }
});

//        Get All Driver  Or  SubOwner     //

exports.getAllAdmin = asyncHandler(async (req, res, next) => {
  const filter = req.query;

  // Fetch garages based on the filter
  const admin = await adminSchema.find(filter).populate({
    path: "garage", // Populate the saved field
    model: "Garages", // Ensure it populates from the Garage model
    select: "-__v -driver -subOwner", // Exclude __v if you don't want it in the response
  });

  // Handle the case where no garages are found
  if (!admin || admin.length === 0) {
    return next(new ApiError("Could not find any admin", 404));
  }
  const formattedAdmins = admin.map((admin) => ({
    adminId: admin._id, // Use `_id` for adminId
    email: admin.email,
    password: admin.password,
    lat: admin.lat,
    lng: admin.lng,
    salary: admin.salary,
    role: admin.role,
    garage: admin.garage.map((garage) => ({
      garageId: garage._id, // Assign _id to garageId
      garageImages: garage.garageImages || [], // Ensure garageImages is always an array
      gragename: garage.gragename,
      grageDescription: garage.grageDescription,
      grageImages: garage.grageImages || "", // Ensure grageImages is a string
      gragePricePerHoure: garage.gragePricePerHoure,
      lat: garage.lat,
      lng: garage.lng,
      openDate: garage.openDate,
      endDate: garage.endDate,
      active: garage.active,
      createdAt: formatDate(garage.createdAt), // Format createdAt field
      updatedAt: formatDate(garage.updatedAt), // Format updatedAt field
    })),
    createdAt: formatDate(admin.createdAt),
    updatedAt: formatDate(admin.updatedAt),
  }));

  // Return the filtered or all admins
  res.status(200).json({ data: formattedAdmins });
});

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const filter = { role: "user" }; // Filter only users with the role "user"

  // Fetch users based on the filter
  const users = await userModel.find(filter).populate({
    path: "saved", // Populate the saved garages field
    model: "Garages",
    select: "-__v", // Exclude __v from the response
  });

  // Handle the case where no users are found
  if (!users || users.length === 0) {
    return next(new ApiError("Could not find any users", 404));
  }

  // Format the response to include user details and saved garages
  const formattedUsers = users.map((user) => ({
    userId: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    carName: user.carName,
    carNumber: user.carNumber,
    carImage: user.carImage,
    wallet: user.wallet,
    savedGarages: user.saved.map((garage) => ({
      garageId: garage._id,
      garageImages: garage.garageImages || [],
      garageName: garage.gragename,
      garageDescription: garage.grageDescription,
      garagePricePerHour: garage.gragePricePerHoure,
      lat: garage.lat,
      lng: garage.lng,
      openDate: garage.openDate,
      endDate: garage.endDate,
      active: garage.active,
    })),
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
  }));

  // Return the filtered users
  res.status(200).json({ data: formattedUsers });
});

//          Update  Admin   //

exports.updataAdminData = asyncHandler(async (req, res, next) => {
  const admin = await adminSchema.findByIdAndUpdate(
    req.params.adminId,
    {
      lat: req.body.lat,
      lng: req.body.lng,
      salary: req.body.salary,
      role: req.body.role,
      garage: req.body.garage,
    },
    { new: true }
  );
  if (!admin) {
    return next(
      new ApiError(
        `Could not find any admin for this id ${req.params.adminId}`,
        404
      )
    );
  } else {
    const formattedAdmins = admin.map((admin) => ({
      adminId: admin._id, // Use `_id` for adminId
      email: admin.email,
      password: admin.password,
      lat: admin.lat,
      lng: admin.lng,
      salary: admin.salary,
      role: admin.role,
      garage: admin.garage.map((garage) => ({
        garageId: garage._id, // Assign _id to garageId
        garageImages: garage.garageImages || [], // Ensure garageImages is always an array
        gragename: garage.gragename,
        grageDescription: garage.grageDescription,
        grageImages: garage.grageImages || "", // Ensure grageImages is a string
        gragePricePerHoure: garage.gragePricePerHoure,
        lat: garage.lat,
        lng: garage.lng,
        openDate: garage.openDate,
        endDate: garage.endDate,
        active: garage.active,
        createdAt: formatDate(garage.createdAt), // Format createdAt field
        updatedAt: formatDate(garage.updatedAt), // Format updatedAt field
      })),
      createdAt: formatDate(admin.createdAt),
      updatedAt: formatDate(admin.updatedAt),
    }));
    res.status(200).json(formattedAdmins);
  }
});

//        Delet Specific  Admin   //
exports.removeSpecificAdmin = asyncHandler(async (req, res, next) => {
  const admin = await adminSchema.findByIdAndDelete(req.params.adminId);

  if (!admin) {
    return next(
      new ApiError(
        `Could not find any admin for this garage id ${req.params.adminId}`,
        404
      )
    );
  } else {
    res.status(200).json("Admin deleated successfully");
  }
});
