// const userSchema = require("../models/authModel");
// const ApiError = require("../utils/apiError");
// const asyncHandler = require("express-async-handler");
// const ApiFeatures = require("../utils/apiFetures");
// const garageSchema = require("../models/garageModel");
// const formatDate = require("../middleware/formatDateMiddleware");
// // Add Garage to Saved List
// // exports.addGarageToSaved = asyncHandler(async (req, res, next) => {
// //     const user = await userSchema.findByIdAndUpdate(
// //         req.user._id,
// //         { $addToSet: { saved: req.body.garageId } },
// //         { new: true } // Return the updated document
// //     ).populate({
// //         path: 'saved', // Populate the saved field
// //         model: 'Garages', // Ensure it populates from the Garage model
// //         select: '-__v' // Exclude __v if you don't want it in the response
// //     });

// //     if (!user) {
// //         return res.status(404).json({
// //             status: "Error",
// //             message: "User not found"
// //         });
// //     }

// //     res.status(200).json({
// //         status: "Success",
// //         message: "Garage added successfully to your saved list",
// //         data: user.saved // This now contains the full garage data
// //     });
// // });

// const formatGarage = (garage) => {
//   return {
//     driver: garage.driver || [],
//     subOwner: garage.subOwner || [],
//     garageId: garage._id.toString(), // Format _id as a string
//     gragename: garage.gragename || "",
//     grageDescription: garage.grageDescription || "",
//     grageImages: garage.grageImages || "",
//     gragePricePerHoure: garage.gragePricePerHoure || 0,
//     lat: garage.lat || 0,
//     lng: garage.lng || 0,
//     openDate: formatDate(garage.openDate),
//     endDate: formatDate(garage.endDate), /// Format ISO 8601
//     active: garage.active || false,
//     createdAt: formatDate(garage.createdAt),
//     updatedAt: formatDate(garage.updatedAt), // Format ISO 8601
//   };
// };

// exports.addGarageToSaved = asyncHandler(async (req, res, next) => {
//   const user = await userSchema
//     .findByIdAndUpdate(
//       req.user._id,
//       { $addToSet: { saved: req.body.garageId } },
//       { new: true } // Return the updated document
//     )
//     .populate({
//       path: "saved", // Populate the saved field
//       model: "Garages", // Ensure it populates from the Garage model
//       select: "-__v ", // Exclude __v if you don't want it in the response
//     });

//   if (!user) {
//     return res.status(404).json({
//       status: "Error",
//       message: "User not found",
//     });
//   }

//   // Format the garage data
//   const formattedGarages = user.saved.map(formatGarage);

//   res.status(200).json({
//     status: "Success",
//     message: "Garage added successfully to your saved list",
//     data: formattedGarages,
//   });
// });

// // Get User's Saved Garages
// // exports.getUserGarage = asyncHandler(async (req, res, next) => {
// //     const user = await userSchema.findById(req.user._id);

// //     if (!user) {
// //         return res.status(404).json({
// //             status: "Error",
// //             message: "User not found"
// //         });
// //     }

// //     res.status(200).json({
// //         status: "Success",
// //         data: user.saved
// //     });
// // });
// exports.getUserSavedGarage = asyncHandler(async (req, res, next) => {
//   const { search } = req.query; // Get the search term from query parameters

//   // Fetch the user by ID
//   const user = await userSchema.findById(req.user._id).populate({
//     path: "saved", // Populate the saved field
//     model: "Garages", // Ensure it populates from the Garage model
//     select: "-__v -driver -subOwner", // Exclude __v if you don't want it in the response
//   });
//   if (!user) {
//     return res.status(404).json({
//       status: "Error",
//       message: "User not found",
//     });
//   }

//   // Construct the query to search garages by `gragename`
//   const query = search ? { gragename: new RegExp(search, "i") } : {};

//   // Fetch the garages from the database based on the query
//   const garages = await garageSchema.find(query);
//   const formattedGarages = garages.map(formatGarage);

//   res.status(200).json({
//     status: "Success",
//     data: formattedGarages,
//   });
// });

// //    Delete User's Saved Garages //

// exports.removeGarageFromSaved = asyncHandler(async (req, res, next) => {
//   const user = await userSchema.findByIdAndUpdate(
//     req.user._id,
//     { $pull: { saved: req.body.garageId } },
//     { new: true }
//   );

//   if (!user) {
//     return res.status(404).json({
//       status: "Error",
//       message: "User not found",
//     });
//   }
//   const formattedGarages = user.saved.map(formatGarage);

//   res.status(200).json({
//     status: "Success",
//     message: "Garage removed successfully to your saved list",
//     data: formattedGarages,
//   });
// });


const userSchema = require("../models/authModel");
const ApiError = require("../utils/apiError");
const asyncHandler = require("express-async-handler");
const garageSchema = require('../models/garageModel');
const formatDate = require("../middleware/formatDateMiddleware");

const formatGarage = (garage) => {
    return {
        driver: garage.driver || [],
        subOwner: garage.subOwner || [],
        garageId: garage._id.toString(),
        gragename: garage.gragename || '',
        grageDescription: garage.grageDescription || '',
        grageImages: garage.grageImages || '',
        gragePricePerHoure: garage.gragePricePerHoure || 0,
        lat: garage.lat || 0,
        lng: garage.lng || 0,
        openDate: formatDate(garage.openDate),
        endDate: formatDate(garage.endDate),
        active: garage.active || false,
        createdAt: formatDate(garage.createdAt),
        updatedAt: formatDate(garage.updatedAt),
    };
};

// Add Garage to Saved List
exports.addGarageToSaved = asyncHandler(async (req, res) => {
    const user = await userSchema.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { saved: req.body.garageId } },
        { new: true }
    ).populate({
        path: 'saved',
        model: 'Garages',
        select: '-__v',
    });

    if (!user) {
        return res.status(404).json({ status: "Error", message: "User not found" });
    }

    const formattedGarages = user.saved.map(formatGarage);
    res.status(200).json({
        status: "Success",
        message: "Garage added successfully to your saved list",
        data: formattedGarages,
    });
});

// Get User's Saved Garages
exports.getUserSavedGarage = asyncHandler(async (req, res) => {
    const { search } = req.query;
    const user = await userSchema.findById(req.user._id).populate({
        path: 'saved',
        model: 'Garages',
        select: '-__v -driver -subOwner',
    });

    if (!user) {
        return res.status(404).json({ status: "Error", message: "User not found" });
    }

    let garages = user.saved;
    if (search) {
        garages = garages.filter(garage =>
            new RegExp(search, 'i').test(garage.gragename)
        );
    }

    const formattedGarages = garages.map(formatGarage);
    res.status(200).json({
        status: "Success",
        data: formattedGarages,
    });
});

// Remove Garage from Saved List
exports.removeGarageFromSaved = asyncHandler(async (req, res) => {
    const { garageId } = req.body;
    const user = await userSchema.findById(req.user._id);

    if (!user) {
        return res.status(404).json({ status: "Error", message: "User not found" });
    }

    if (!user.saved.includes(garageId)) {
        return res.status(400).json({ status: "Error", message: "Garage ID not found in saved list" });
    }

    await userSchema.findByIdAndUpdate(
        req.user._id,
        { $pull: { saved: garageId } },
        { new: true }
    );

    const updatedUser = await userSchema.findById(req.user._id).populate({
        path: 'saved',
        model: 'Garages',
        select: '-__v',
    });

    const formattedGarages = updatedUser.saved.map(formatGarage);
    res.status(200).json({
        status: "Success",
        message: "Garage removed successfully from your saved list",
        data: formattedGarages,
    });
});