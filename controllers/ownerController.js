const ownerSchema = require("../models/ownerModel");
const garageSchema = require("../models/garageModel");
const ApiError = require("../utils/apiError");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const formatDate = require("../middleware/formatDateMiddleware");

// Register
exports.signUpForOwner = asyncHandler(async (req, res, next) => {
  const { email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12);

  const owner = await ownerSchema.create({
    email,
    password: hashedPassword,
    role,
  });

  const token = jwt.sign({ ownerId: owner.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

  const formattedOwner = {
    ownerId: owner._id,
    email: owner.email,
    password: owner.password,
    role: owner.role,
    createdAt: formatDate(owner.createdAt),
    updatedAt: formatDate(owner.updatedAt),
  };
  //   await user.save();

  res.status(200).json({ ownerData: formattedOwner, token });
});

exports.loginForOwner = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const owner = await ownerSchema.findOne({ email });

  if (!owner) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  // Compare the provided password with the hashed password in the database
  const isMatch = await bcrypt.compare(password, owner.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Generate a JWT token
  const token = jwt.sign({ ownerId: owner.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

  const formattedUser = {
    ownerId: owner._id,
    username: owner.username,
    email: owner.email,
    role: owner.role,
    createdAt: formatDate(owner.createdAt),
    updatedAt: formatDate(owner.updatedAt),
  };

  res.status(200).json({
    message: "Login successful",
    ownerData: formattedUser,
    token,
  });
});

// exports.getAllGaragesInOwner = asyncHandler(async (req, res, next) => {
//   // Check if the active query parameter is passed
//   const filter = req.query;
//   // .active === 'true' ? { active: true } : {}; // Use {} to return all if no filter is provided

//   // Fetch garages based on the filter
//   const garages = await garageSchema.find(filter);

//   // Handle the case where no garages are found
//   if (!garages || garages.length === 0) {
//     return next(new ApiError("Could not find any garage", 404));
//   }

//   // Fetch the current user's saved garages using userId from the token
//   // const user = await userSchema.findById(req.user._id);
//   // const savedGarageIds = user.saved.map((garage) => garage._id.toString());

//   // Format the garages and check if each one is saved by the user
//   const formattedGarages = garages.map((garage) => ({
//     garageId: garage._id.toString(), // Format _id as a string
//     gragename: garage.gragename || "",
//     grageDescription: garage.grageDescription || "",
//     grageImages: garage.grageImages || "", // Assuming it's an array; adjust if needed
//     gragePricePerHoure: garage.gragePricePerHoure || 0,
//     lat: garage.lat || 0,
//     lng: garage.lng || 0,
//     openDate: formatDate(garage.openDate),
//     endDate: formatDate(garage.endDate),
//     active: garage.active || false,
//     driver: garage.driver.map((id) => id.toString()), // Ensure IDs are strings
//     subOwner: garage.subOwner.map((id) => id.toString()), // Ensure IDs are strings
//     createdAt: formatDate(garage.createdAt),
//     updatedAt: formatDate(garage.updatedAt), // Format ISO 8601
//   }));

//   // Return the filtered or all garages
//   res.status(200).json({ "Garage Details": formattedGarages });
// });\

// exports.getAllGaragesInOwner = asyncHandler(async (req, res, next) => {
//   // Create a filter object from the query parameters
//   const filter = req.query;

//   try {
//     // Fetch garages based on the filter and populate the driver field
//     const garages = await garageSchema
//       .find(filter)
//       .populate('driver', 'name email phone') // Populate driver details
//       .populate('Admin', 'name email phone'); // Populate driver details

//     // Check if garages were found
//     if (!garages || garages.length === 0) {
//       return next(new ApiError("Could not find any garage", 404));
//     }

//     // Format the garages and include driver data
//     const formattedGarages = garages.map((garage) => ({
//       garageId: garage._id.toString(), // Convert _id to string
//       gragename: garage.gragename || "", // Default empty string if name is missing
//       grageDescription: garage.grageDescription || "",
//       grageImages: garage.grageImages || [], // Assuming it's an array
//       gragePricePerHoure: garage.gragePricePerHoure || 0, // Default to 0 if missing
//       lat: garage.lat || 0, // Default to 0 if missing
//       lng: garage.lng || 0,
//       openDate: formatDate(garage.openDate), // Format openDate
//       endDate: formatDate(garage.endDate), // Format endDate
//       active: garage.active || false, // Default to false if missing
//       driver: garage.driver ? { // Check if driver exists
//         driverId: garage.driver._id.toString(),
//         name: garage.driver.name || "",
//         email: garage.driver.email || "",
//         phone: garage.driver.phone || "",
//       } : null, // Set to null if no driver is populated
//       subOwner: garage.subOwner.map((id) => id.toString()), // Ensure IDs are strings
//       createdAt: formatDate(garage.createdAt), // Format createdAt
//       updatedAt: formatDate(garage.updatedAt), // Format updatedAt
//     }));

//     // Return the filtered or all garages
//     res.status(200).json({ "Garage Details": formattedGarages });
//   } catch (error) {
//     // Log the error for debugging purposes
//     console.error('Error fetching garages:', error);

//     // Return an error response
//     return next(new ApiError("Failed to retrieve garages", 500));
//   }
// });

exports.getAllGaragesInOwner = asyncHandler(async (req, res, next) => {
  // Create a filter object from the query parameters
  const filter = req.query;

  try {
    // Fetch garages based on the filter and populate the driver and subOwner fields
    const garages = await garageSchema // Use garageModel here
      .find(filter)
      .populate("driver", "name email phone")  // Populate driver details
      .populate("subOwner", "name email phone"); // Populate subOwner details

    // Check if garages were found
    if (!garages || garages.length === 0) {
      return next(new ApiError("Could not find any garage", 404));
    }

    // Format the garages and include driver and subOwner data
    const formattedGarages = garages.map((garage) => ({
      garageId: garage._id.toString(), // Convert _id to string
      gragename: garage.gragename || "", // Default empty string if name is missing
      grageDescription: garage.grageDescription || "",
      grageImages: garage.garageImages || [], // Assuming it's an array
      gragePricePerHoure: garage.gragePricePerHoure || 0, // Default to 0 if missing
      lat: garage.lat || 0, // Default to 0 if missing
      lng: garage.lng || 0,
      openDate: formatDate(garage.openDate), // Format openDate
      endDate: formatDate(garage.endDate), // Format endDate
      active: garage.active || false, // Default to false if missing

      // Driver data (populated)
      driver: Array.isArray(garage.driver) && garage.driver.length > 0 ? garage.driver.map((drv) => ({
        driverId: drv._id.toString(),
        name: drv.name || "",
        email: drv.email || "",
        phone: drv.phone || "",
      })) : null, // Set to null if no driver is populated

      // SubOwner data (populated)
      subOwner: Array.isArray(garage.subOwner) && garage.subOwner.length > 0 ? garage.subOwner.map((sub) => ({
        subOwnerId: sub._id.toString(),
        name: sub.name || "",
        email: sub.email || "",
        phone: sub.phone || "",
      })) : [], // Set to empty array if no subOwners are populated

      createdAt: formatDate(garage.createdAt), // Format createdAt
      updatedAt: formatDate(garage.updatedAt), // Format updatedAt
    }));

    // Return the filtered or all garages
    res.status(200).json({ "Garage Details": formattedGarages });
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error fetching garages:', error);

    // Return an error response
    return next(new ApiError("Failed to retrieve garages", 500));
  }
});




// exports.getAllGaragesInOwner = asyncHandler(async (req, res, next) => {
//   // Check if the active query parameter is passed
//   const filter = req.query;

//   // Fetch garages based on the filter and populate the driver field
//   const garages = await garageSchema
//     .find(filter)
//     .populate("driver", "name email phone")
//     .populate("Admin", "name email phone");

//   // Handle the case where no garages are found
//   if (!garages || garages.length === 0) {
//     return next(new ApiError("Could not find any garage", 404));
//   }

//   // Format the garages and include driver data
//   const formattedGarages = garages.map((garage) => ({
//     garageId: garage._id.toString(), // Format _id as a string
//     gragename: garage.gragename || "",
//     grageDescription: garage.grageDescription || "",
//     grageImages: garage.grageImages || "", // Assuming it's an array; adjust if needed
//     gragePricePerHoure: garage.gragePricePerHoure || 0,
//     lat: garage.lat || 0,
//     lng: garage.lng || 0,
//     openDate: formatDate(garage.openDate),
//     endDate: formatDate(garage.endDate),
//     active: garage.active || false,
//     driver: garage.driver.map((drv) => ({
//       driverId: drv._id.toString(),
//       name: drv.name || "",
//       email: drv.email || "",
//       phone: drv.phone || "",
//     })), // Populated driver data
//     subOwner: garage.subOwner.map((id) => id.toString()), // Ensure IDs are strings
//     createdAt: formatDate(garage.createdAt),
//     updatedAt: formatDate(garage.updatedAt),
//   }));

//   // Return the filtered or all garages
//   res.status(200).json({ "Garage Details": formattedGarages });
// });
