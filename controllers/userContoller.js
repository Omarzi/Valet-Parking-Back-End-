const userSchema = require("../models/authModel");
const garageSchema = require("../models/garageModel");
const orderSchema = require("../models/oderModel");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const bcrypt = require("bcrypt");
const QRCode = require("qrcode");
const moment = require("moment");
const formatDate = require("../middleware/formatDateMiddleware");
const jwt = require("jsonwebtoken");

exports.getProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await userSchema.findById(userId).populate({
    path: "saved",
    model: "Garages",
    select: "-__v",
  });
  if (!user) {
    return next(
      new ApiError(`could not found user by this id ${req.params.useId} `, 404)
    );
  }

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
    saved: user.saved.map((item) => ({
      ...item.toObject(),
      openDate: formatDate(item.openDate),
      endDate: formatDate(item.endDate), // Convert to a plain object if needed (e.g., Mongoose document)
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt),
    })),
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
  };
  delete user._doc.password && delete user._doc.__v;
  res.status(200).json(formattedUser);
});

exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await userSchema.findByIdAndUpdate(
    userId,
    {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      profileImage: req.body.profileImage,
      carname: req.body.carName,
      carnumber: req.body.carNumber,
      carImage: req.body.carImage,
    },
    { new: true }
  );
  if (!user) {
    return next(
      new ApiError(`could not found user by this id ${req.params.useId} `, 404)
    );
  }
  const formattedUser = {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    carName: user.carName,
    carNumber: user.carNumber,
    carImage: user.carImage,
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
  };
  delete user._doc.password && delete user._doc.__v;
  res.status(200).json(formattedUser);
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await userSchema
    .findByIdAndUpdate(
      req.params.userId,
      {
        password: await bcrypt.hash(req.body.newPassword, 12),
        passwordChangedAt: Date.now(),
      },
      { new: true }
    )
    .populate({
      path: "saved",
      model: "Garages",
      select: "-__v",
    });

  if (!user) {
    return next(
      new ApiError(`could not find user by this id ${req.params.userId}`, 404)
    );
  }

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
    saved: user.saved.map((item) => ({
      ...item.toObject(),
      openDate: formatDate(item.openDate),
      endDate: formatDate(item.endDate), // Convert to a plain object if needed (e.g., Mongoose document)
      createdAt: formatDate(item.createdAt),
      updatedAt: formatDate(item.updatedAt),
    })),
    createdAt: formatDate(user.createdAt),
    updatedAt: formatDate(user.updatedAt),
  };

  // Sending the response as an object containing both user data and token
  res.status(200).json({
    status: "success",
    user: formattedUser,
    token: token,
  });
});

exports.getAllGarages = asyncHandler(async (req, res, next) => {
  // Check if the active query parameter is passed
  const filter = req.query;
  // .active === 'true' ? { active: true } : {}; // Use {} to return all if no filter is provided

  // Fetch garages based on the filter
  const garages = await garageSchema.find(filter);

  // Handle the case where no garages are found
  if (!garages || garages.length === 0) {
    return next(new ApiError("Could not find any garage", 404));
  }

  // Fetch the current user's saved garages using userId from the token
  const user = await userSchema.findById(req.user._id).populate("saved");
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  const savedGarageIds = user.saved.map((garage) => garage._id.toString());

  // Format the garages and check if each one is saved by the user
  const formattedGarages = garages.map((garage) => ({
    garageId: garage._id.toString(), // Format _id as a string
    gragename: garage.gragename || "",
    grageDescription: garage.grageDescription || "",
    grageImages: garage.grageImages || "", // Assuming it's an array; adjust if needed
    gragePricePerHoure: garage.gragePricePerHoure || 0,
    lat: garage.lat || 0,
    lng: garage.lng || 0,
    openDate: formatDate(garage.openDate),
    endDate: formatDate(garage.endDate),
    active: garage.active || false,
    driver: garage.driver.map((id) => id.toString()), // Ensure IDs are strings
    subOwner: garage.subOwner.map((id) => id.toString()), // Ensure IDs are strings
    isSaved: savedGarageIds.includes(garage._id.toString()) ? true : false, // Convert boolean to string
    createdAt: formatDate(garage.createdAt),
    updatedAt: formatDate(garage.updatedAt), // Format ISO 8601
  }));

  // Return the filtered or all garages
  res.status(200).json({ "Garage Details": formattedGarages });
});

exports.getSpecificGarage = asyncHandler(async (req, res, next) => {
  // Ensure userId is available from the token middleware
  if (!req.user._id) {
    return next(new ApiError("User not authenticated", 401));
  }

  // Find the garage by ID
  const findGarage = await garageSchema.findById(req.params.garageId);
  if (!findGarage) {
    return next(new ApiError("This garage is not found", 404));
  }

  // Find the user and check if the garage is in the saved list
  const user = await userSchema.findById(req.user._id);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }

  const isSaved = user.saved.includes(findGarage._id);

  // Format the garage details
  const formattedGarage = {
    garageId: findGarage._id.toString(), // Format _id as a string
    gragename: findGarage.gragename || "",
    grageDescription: findGarage.grageDescription || "",
    grageImages: findGarage.grageImages || "",
    gragePricePerHoure: findGarage.gragePricePerHoure || 0,
    lat: findGarage.lat || 0,
    lng: findGarage.lng || 0,
    openDate: formatDate(findGarage.openDate),
    endDate: formatDate(findGarage.endDate), // Format ISO 8601
    active: findGarage.active || false,
    driver: findGarage.driver || [],
    subOwner: findGarage.subOwner || [],
    isSaved: isSaved ? true : false, // Set isSaved based on whether the garage is in the user's saved list
    createdAt: formatDate(findGarage.createdAt),
    updatedAt: formatDate(findGarage.updatedAt), // Format ISO 8601
  };

  // Send the response
  res.status(200).json({ findGarage: formattedGarage });
});

//  Make   Order   //

// exports.makeOrder = asyncHandler(async (req, res, next) => {
//   const { garage, typeOfCar, timeRange, totalPrice, paymentMethod, date, duration, isPaid, status, startNow } = req.body;

//   // Parse start and end times from the hh:mm:ss am/pm format
//   const startTime = moment(timeRange.start, 'hh:mm:ss A').toDate();  // Parse start time
//   const endTime = moment(timeRange.end, 'hh:mm:ss A').toDate();      // Parse end time

//   if (!startTime || !endTime) {
//     return res.status(400).json({ message: 'Invalid time format. Please use hh:mm:ss am/pm.' });
//   }

//   // Validate and check for overlapping orders if startNow is false
//   if (startNow === false) {
//     if (!duration || !timeRange) {
//       return res.status(400).json({ message: 'Duration and TimeRange are required' });
//     }

//     const foundOrder = await orderSchema.findOne({
//       user: req.params.userId,
//       date,
//       $and: [
//         { "timeRange.start": { $lt: endTime, $gte: startTime } },
//         { "timeRange.end": { $lte: endTime, $gt: startTime } },
//         {
//           $or: [
//             { "timeRange.start": { $lte: startTime } },
//             { "timeRange.end": { $gte: endTime } }
//           ]
//         }
//       ]
//     });

//     if (foundOrder) {
//       return next(new ApiError(`Order with this timeRange already exists for the user`, 409));
//     }
//   }

//   // Calculate timeLeft
//   let timeLeft;
//   const now = Date.now();
//   const startTimestamp = startTime.getTime();
//   const endTimestamp = endTime.getTime();

//   if (startTimestamp <= now) {
//     timeLeft = endTimestamp - now;
//   }

//   // Create the new order
//   const newOrderData = {
//     user: req.params.userId,
//     garage,
//     typeOfCar,
//     date,
//     timeRange: {
//       start: startTime,
//       end: endTime
//     },
//     totalPrice,
//     duration,
//     paymentMethod,
//     isPaid,
//     status,
//     startNow,
//     timeLeft
//   };

//   // Handle wallet payment logic if paymentMethod is 'wallet'
//   if (paymentMethod === 'wallet') {
//     const user = await userSchema.findById(req.params.userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User or wallet not found' });
//     }

//     if (user.wallet < totalPrice || user.wallet === 0) {
//       return res.status(400).json({ message: 'Sorry, you do not have enough money in your wallet' });
//     }

//     // Subtract the totalPrice from the wallet
//     user.wallet -= totalPrice;
//     await user.save();
//   }

//   // Generate the QR code based on userId and placeId (or garageId)
//   const qrData = JSON.stringify({ userId: req.params.userId, garageId: req.body.garageId });

//   try {
//     // Generate the QR code as a data URL
//     const qrImage = await QRCode.toDataURL(qrData);
//     newOrderData.qrCode = qrImage;

//     // Save the new order in the database
//     const newOrder = await orderSchema.create(newOrderData);

//     // Respond with the created order and the QR code image (base64)

//     res.status(201).json({
//       message: 'Order created successfully',
//       order: newOrder
//     });
//   } catch (err) {
//     console.error('Error generating QR code:', err);
//     return next(new ApiError(`Failed to generate QR code`, 500));
//   }
// });

///////////////////////////////////////////////////////////////////////////////////////////////////

// exports.makeOrder = asyncHandler(async (req, res, next) => {
//   const {
//     garage,
//     typeOfCar,
//     timeRange,
//     totalPrice,
//     paymentMethod,
//     date,
//     duration,
//     isPaid,
//     status,
//     startNow,
//   } = req.body;

//   // Parse start and end times from the hh:mm:ss am/pm format
//   const startTime = moment(timeRange.start, "hh:mm:ss A").toDate();
//   const endTime = moment(timeRange.end, "hh:mm:ss A").toDate();

//   if (!startTime || !endTime) {
//     return res
//       .status(400)
//       .json({ message: "Invalid time format. Please use hh:mm:ss am/pm." });
//   }

//   try {
//     // Create the new order data object before QR code generation
//     const newOrderData = {
//       user: req.params.userId,
//       garage,
//       typeOfCar,
//       date,
//       timeRange: {
//         start: startTime,
//         end: endTime,
//       },
//       totalPrice,
//       duration,
//       paymentMethod,
//       isPaid,
//       status,
//       startNow,
//     };

//     // Save the new order in the database to generate the orderId
//     const newOrder = await orderSchema.create(newOrderData);

//     // Generate the QR code based on orderId and garageId
//     const qrData = JSON.stringify({
//       orderId: newOrder._id, // Using the newly generated orderId
//       garageId: req.body.garageId,
//     });

//     // Generate the QR code as a data URL
//     const qrImage = await QRCode.toDataURL(qrData);

//     // Add the QR code to the order after it's generated
//     newOrder.qrCode = qrImage;

//     // Save the updated order with the QR code
//     await newOrder.save();

//     // Refetch the saved order with user and garage data populated
//     const populatedOrder = await orderSchema
//       .findById(newOrder._id)
//       .populate("user")
//       .populate("garage");

//     // Respond with the created order and the QR code image (base64)
//     res.status(201).json({
//       message: "Order created successfully",
//       order: populatedOrder,
//     });
//   } catch (err) {
//     console.error("Error generating QR code:", err); // Log the error for debugging
//     return next(
//       new ApiError(`Failed to generate QR code: ${err.message}`, 500)
//     ); // Return more detailed error
//   }
// });

///////////////////////////////////////////////////////////////////////////////////////////////////

// exports.makeOrder = asyncHandler(async (req, res, next) => {
//   const { garage, typeOfCar, timeRange, totalPrice, paymentMethod, date, duration, isPaid, status, startNow } = req.body;

//   // Parse start and end times from the hh:mm:ss am/pm format
//   const startTime = moment(timeRange.start, 'hh:mm:ss A').toDate();
//   const endTime = moment(timeRange.end, 'hh:mm:ss A').toDate();

//   if (!startTime || !endTime) {
//     return res.status(400).json({ message: 'Invalid time format. Please use hh:mm:ss am/pm.' });
//   }

//   // Validate and check for overlapping orders
//   if (startNow === false) {
//     if (!duration || !timeRange) {
//       return res.status(400).json({ message: 'Duration and TimeRange are required' });
//     }

//     const foundOrder = await orderSchema.findOne({
//       user: req.params.userId,
//       date,
//       $and: [
//         { "timeRange.start": { $lt: endTime, $gte: startTime } },
//         { "timeRange.end": { $lte: endTime, $gt: startTime } }
//       ]
//     });

//     if (foundOrder) {
//       return next(new ApiError(`Order with this timeRange already exists for the user`, 409));
//     }
//   }

//   // Fetch user and garage data
//   const user = await userSchema.findById(req.params.userId).select('-__v'); // Exclude version field
//   const garageData = await garageSchema.findById(garage).select('-__v'); // Exclude version field

//   if (!user || !garageData) {
//     return res.status(404).json({ message: 'User or garage not found' });
//   }

//   // Calculate timeLeft
//   let timeLeft;
//   const now = Date.now();
//   const startTimestamp = startTime.getTime();
//   const endTimestamp = endTime.getTime();
//   if (startTimestamp <= now) {
//     timeLeft = endTimestamp - now;
//   }

//   // Create the new order
//   const newOrderData = {
//     user: req.params.userId,
//     garage: garage,
//     typeOfCar,
//     date,
//     timeRange: {
//       start: startTime,
//       end: endTime
//     },
//     totalPrice,
//     duration,
//     paymentMethod,
//     isPaid,
//     status,
//     startNow,
//     timeLeft
//   };

//   // // Handle wallet payment logic if paymentMethod is 'wallet'
//   // if (paymentMethod === 'wallet') {
//   //   if (user.wallet < totalPrice) {
//   //     return res.status(400).json({ message: 'Insufficient wallet balance' });
//   //   }

//   //   // Subtract the totalPrice from the wallet
//   //   user.wallet -= totalPrice;
//   //   await user.save();
//   // }

//   // Validate if the user has a wallet field
//   if (paymentMethod === 'wallet') {
//     if (user.wallet === undefined || user.wallet === null || isNaN(user.wallet)) {
//       return res.status(422).json({ message: 'User wallet information is missing or invalid' });
//     }

//     if (user.wallet < totalPrice) {
//       return res.status(422).json({ message: 'Insufficient wallet balance' });
//     }

//     // Subtract the totalPrice from the wallet
//     user.wallet -= totalPrice;
//     await user.save();
//   } 

//   // Generate QR code
//   const qrData = JSON.stringify({ userId: req.params.userId, garageId: garage });
//   try {
//     const qrImage = await QRCode.toDataURL(qrData);
//     newOrderData.qrCode = qrImage;

//     // Save the new order
//     const newOrder = await orderSchema.create(newOrderData);

//     // Populate the user and garage details in the newly created order
//     const populatedOrder = await newOrder.populate([
//       {
//         path: 'user',
//         model: 'Users',
//         select: '-__v' // Fetch all user data except the version field
//       },
//       {
//         path: 'garage',
//         model: 'Garages',
//         select: '-__v' // Fetch all garage data except the version field
//       }
//     ]);

//     // Custom formatting of user and garage data
//     const formattedOrder = {
//       orderId: populatedOrder._id,
//       user: {
//         userId: populatedOrder.user._id,
//         name: populatedOrder.user.username,
//         email: populatedOrder.user.email,
//         phone: populatedOrder.user.phone,
//         carName: populatedOrder.user.carName,
//         carNumber: populatedOrder.user.carNumber,
//         wallet: populatedOrder.user.wallet,
//         createdAt: formatDate(populatedOrder.user.createdAt),
//         updatedAt: formatDate(populatedOrder.user.updatedAt)
//       },
//       garage: {
//         garageId: populatedOrder.garage._id,
//         driver:populatedOrder.garage.driver || [],
//         subOwner: populatedOrder.garage.subOwner || [],
//         garageId: populatedOrder.garage._id.toString(), // Format _id as a string
//         gragename: populatedOrder.garage.gragename || '',
//         grageDescription: populatedOrder.garage.grageDescription || '',
//         grageImages: populatedOrder.garage.grageImages || '',
//         gragePricePerHoure: populatedOrder.garage.gragePricePerHoure || 0,
//         lat: populatedOrder.garage.lat || 0,
//         lng: populatedOrder.garage.lng || 0,
//         openDate:formatDate(populatedOrder.garage.openDate),
//         endDate: formatDate(populatedOrder.garage.endDate) ,/// Format ISO 8601
//         active: populatedOrder.garage.active || false,
//         createdAt: formatDate(populatedOrder.garage.createdAt),
//         updatedAt: formatDate(populatedOrder.garage.updatedAt)
//       },
//       typeOfCar: populatedOrder.typeOfCar,
//       date: populatedOrder.date,
//       timeRange: {
//         start: moment(populatedOrder.timeRange.start).format('h:mm A'),
//         end: moment(populatedOrder.timeRange.end).format('h:mm A')
//       },
//       totalPrice: populatedOrder.totalPrice,
//       duration: populatedOrder.duration,
//       paymentMethod: populatedOrder.paymentMethod,
//       isPaid: populatedOrder.isPaid,
//       status: populatedOrder.status,
//       startNow: populatedOrder.startNow,
//       timeLeft: populatedOrder.timeLeft,
//       qrCode: populatedOrder.qrCode,
//       createdAt: formatDate(populatedOrder.createdAt),
//       updatedAt: formatDate(populatedOrder.updatedAt)
//     };

//     res.status(201).json({
//       message: 'Order created successfully',
//       order: formattedOrder // Return the formatted order
//     });
//   } catch (err) {
//     console.error('Error generating QR code:', err);
//     return next(new ApiError('Failed to generate QR code', 500));
//   }
// });

exports.makeOrder = asyncHandler(async (req, res, next) => {
  const { garage, typeOfCar, timeRange, totalPrice, paymentMethod, date, duration, isPaid, status, startNow } = req.body;

  // Parse start and end times from the hh:mm:ss am/pm format
  const startTime = moment(timeRange.start, 'hh:mm:ss A').toDate();
  const endTime = moment(timeRange.end, 'hh:mm:ss A').toDate();

  if (!startTime || !endTime) {
    return res.status(400).json({ message: 'Invalid time format. Please use hh:mm:ss am/pm.' });
  }

  // Validate and check for overlapping orders
  if (startNow === false) {
    if (!duration || !timeRange) {
      return res.status(400).json({ message: 'Duration and TimeRange are required' });
    }

    const foundOrder = await orderSchema.findOne({
      user: req.params.userId,
      date,
      $and: [
        { "timeRange.start": { $lt: endTime, $gte: startTime } },
        { "timeRange.end": { $lte: endTime, $gt: startTime } }
      ]
    });

    if (foundOrder) {
      return next(new ApiError(`Order with this timeRange already exists for the user`, 409));
    }
  }

  // Fetch user and garage data
  const user = await userSchema.findById(req.params.userId).select('-__v'); // Exclude version field
  const garageData = await garageSchema.findById(garage).select('-__v'); // Exclude version field

  if (!user || !garageData) {
    return res.status(404).json({ message: 'User or garage not found' });
  }

  // Function to generate a unique order number
  const generateUniqueOrderNumber = async () => {
    let orderNumber;
    let isUnique = false;

    while (!isUnique) {
      // Generate a random order number, e.g., a 6-digit number
      orderNumber = Math.floor(100000 + Math.random() * 900000).toString();

      // Check if the generated order number already exists in the database
      const existingOrder = await orderSchema.findOne({ orderNumber });
      if (!existingOrder) {
        isUnique = true; // The generated order number is unique
      }
    }

    return orderNumber;
  };

  // Generate a unique order number
  const orderNumber = await generateUniqueOrderNumber();

  // Calculate timeLeft
  let timeLeft;
  const now = Date.now();
  const startTimestamp = startTime.getTime();
  const endTimestamp = endTime.getTime();
  if (startTimestamp <= now) {
    timeLeft = endTimestamp - now;
  }

  // Create the new order
  const newOrderData = {
    user: req.params.userId,
    garage: garage,
    typeOfCar,
    date,
    timeRange: {
      start: startTime,
      end: endTime
    },
    totalPrice,
    duration,
    paymentMethod,
    isPaid,
    status,
    startNow,
    timeLeft,
    orderNumber // Add the unique order number to the order data
  };

  // Validate if the user has a wallet field
  if (paymentMethod === 'wallet') {
    if (user.wallet === undefined || user.wallet === null || isNaN(user.wallet)) {
      return res.status(422).json({ message: 'User wallet information is missing or invalid' });
    }

    if (user.wallet < totalPrice) {
      return res.status(422).json({ message: 'Insufficient wallet balance' });
    }

    // Subtract the totalPrice from the wallet
    user.wallet -= totalPrice;
    await user.save();
  }

  // Generate QR code
  const qrData = JSON.stringify({ userId: req.params.userId, garageId: garage });
  try {
    const qrImage = await QRCode.toDataURL(qrData);
    newOrderData.qrCode = qrImage;

    // Save the new order
    const newOrder = await orderSchema.create(newOrderData);

    // Populate the user and garage details in the newly created order
    const populatedOrder = await newOrder.populate([
      {
        path: 'user',
        model: 'Users',
        select: '-__v' // Fetch all user data except the version field
      },
      {
        path: 'garage',
        model: 'Garages',
        select: '-__v' // Fetch all garage data except the version field
      }
    ]);

    // Custom formatting of user and garage data
    const formattedOrder = {
      orderId: populatedOrder._id,
      orderNumber: populatedOrder.orderNumber,
      user: {
        userId: populatedOrder.user._id,
        name: populatedOrder.user.username,
        email: populatedOrder.user.email,
        phone: populatedOrder.user.phone,
        carName: populatedOrder.user.carName,
        carNumber: populatedOrder.user.carNumber,
        wallet: populatedOrder.user.wallet,
        createdAt: formatDate(populatedOrder.user.createdAt),
        updatedAt: formatDate(populatedOrder.user.updatedAt)
      },
      garage: {
        garageId: populatedOrder.garage._id,
        driver: populatedOrder.garage.driver || [],
        subOwner: populatedOrder.garage.subOwner || [],
        garageId: populatedOrder.garage._id.toString(),
        gragename: populatedOrder.garage.gragename || '',
        grageDescription: populatedOrder.garage.grageDescription || '',
        grageImages: populatedOrder.garage.grageImages || '',
        gragePricePerHoure: populatedOrder.garage.gragePricePerHoure || 0,
        lat: populatedOrder.garage.lat || 0,
        lng: populatedOrder.garage.lng || 0,
        openDate: formatDate(populatedOrder.garage.openDate),
        endDate: formatDate(populatedOrder.garage.endDate),
        active: populatedOrder.garage.active || false,
        createdAt: formatDate(populatedOrder.garage.createdAt),
        updatedAt: formatDate(populatedOrder.garage.updatedAt)
      },
      typeOfCar: populatedOrder.typeOfCar,
      date: populatedOrder.date,
      timeRange: {
        start: moment(populatedOrder.timeRange.start).format('h:mm A'),
        end: moment(populatedOrder.timeRange.end).format('h:mm A')
      },
      totalPrice: populatedOrder.totalPrice,
      duration: populatedOrder.duration,
      paymentMethod: populatedOrder.paymentMethod,
      isPaid: populatedOrder.isPaid,
      status: populatedOrder.status,
      startNow: populatedOrder.startNow,
      timeLeft: populatedOrder.timeLeft,
      qrCode: populatedOrder.qrCode,
      createdAt: formatDate(populatedOrder.createdAt),
      updatedAt: formatDate(populatedOrder.updatedAt)
    };

    res.status(201).json({
      message: 'Order created successfully',
      order: formattedOrder
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return next(new ApiError('Failed to generate QR code', 500));
  }
});


// exports.makeOrder = asyncHandler(async (req, res, next) => {
//   const {
//     garage,
//     typeOfCar,
//     timeRange,
//     totalPrice,
//     paymentMethod,
//     date,
//     duration,
//     isPaid,
//     status,
//     startNow,
//   } = req.body;

//   // Parse start and end times from the hh:mm:ss am/pm format
//   const startTime = moment(timeRange.start, "hh:mm:ss A").toDate();
//   const endTime = moment(timeRange.end, "hh:mm:ss A").toDate();

//   if (!startTime || !endTime) {
//     return res
//       .status(400)
//       .json({ message: "Invalid time format. Please use hh:mm:ss am/pm." });
//   }

//   // Other validations and order creation logic...

//   // Create the new order data object before QR code generation
//   const newOrderData = {
//     user: req.params.userId,
//     garage,
//     typeOfCar,
//     date,
//     timeRange: {
//       start: startTime,
//       end: endTime,
//     },
//     totalPrice,
//     duration,
//     paymentMethod,
//     isPaid,
//     status,
//     startNow,
//   };

//   // Generate the QR code based on userId and garageId
//   const qrData = JSON.stringify({
//     userId: req.params.userId,
//     garageId: req.body.garageId,
//   });

//   try {
//     // Generate the QR code as a data URL
//     const qrImage = await QRCode.toDataURL(qrData);

//     // Add the QR code to newOrderData after it's generated
//     newOrderData.qrCode = qrImage;

//     // Save the new order in the database
//     const newOrder = await orderSchema.create(newOrderData);

//     // Refetch the saved order with user and garage data populated
//     const populatedOrder = await orderSchema
//       .findById(newOrder._id)
//       .populate("user")
//       .populate("garage");

//     // Respond with the created order and the QR code image (base64)
//     res.status(201).json({
//       message: "Order created successfully",
//       order: populatedOrder,
//     });
//   } catch (err) {
//     console.error("Error generating QR code:", err); // Log the error for debugging
//     return next(
//       new ApiError(`Failed to generate QR code: ${err.message}`, 500)
//     ); // Return more detailed error
//   }
// });

//     Get Specific  Order   //

exports.getOrder = asyncHandler(async( req , res , next) => {
  const order = await orderSchema.findById(req.params.orderId).populate([
    {
      path: 'user',
      model: 'Users',
      select: '-__v '
    },
    {
      path: 'garage',
      model: 'Garages',
     select: '-__v '
    }
  ]);
  if(!order){
      throw next(new ApiError(` This order is not found` , 404))
  }
  else{
    const formattedOrder = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      user: {
        userId: order.user._id,
        name: order.user.username,
        email: order.user.email,
        phone: order.user.phone,
        carName: order.user.carName,
        carNumber: order.user.carNumber,
        wallet: order.user.wallet,
        createdAt: formatDate(order.user.createdAt),
        updatedAt: formatDate(order.user.updatedAt)
      },
      garage: {
        garageId: order.garage._id,
        driver:order.garage.driver || [],
        subOwner: order.garage.subOwner || [],
        garageId: order.garage._id.toString(), // Format _id as a string
        gragename: order.garage.gragename || '',
        grageDescription: order.garage.grageDescription || '',
        grageImages: order.garage.grageImages || '',
        gragePricePerHoure: order.garage.gragePricePerHoure || 0,
        lat: order.garage.lat || 0,
        lng: order.garage.lng || 0,
        openDate:formatDate(order.garage.openDate),
        endDate: formatDate(order.garage.endDate) ,/// Format ISO 8601
        active: order.garage.active || false,
        createdAt: formatDate(order.garage.createdAt),
        updatedAt: formatDate(order.garage.updatedAt)
      },
      typeOfCar: order.typeOfCar,
      date: order.date,
      timeRange: {
        start: moment(order.timeRange.start).format('h:mm A'),
        end: moment(order.timeRange.end).format('h:mm A')
      },
      totalPrice: order.totalPrice,
      duration: order.duration,
      paymentMethod: order.paymentMethod,
      isPaid: order.isPaid,
      status: order.status,
      startNow: order.startNow,
      timeLeft: order.timeLeft,
      qrCode: order.qrCode,
      createdAt: formatDate(order.createdAt),
      updatedAt: formatDate(order.updatedAt)
    };

    delete formattedOrder.user._id;
    delete formattedOrder.garage._id;

 res.status(200).json( formattedOrder)
}})

// exports.getOrder = asyncHandler(async (req, res, next) => {
//   const order = await orderSchema.findById(req.params.orderId).populate([
//     {
//       path: "user",
//       model: "Users",
//       select: "-__v ",
//     },
//     {
//       path: "garage",
//       model: "Garages",
//       select: "-__v ",
//     },
//   ]);
//   if (!order) {
//     throw next(new ApiError(` This order is not found`, 404));
//   } else {
//     const formattedOrder = {
//       orderId: order._id.toString(),
//       user: {
//         userId: order.user._id.toString(),
//         ...order.user.toObject(), // Include other user fields
//         createdAt: formatDate(order.user.createdAt),
//         updatedAt: formatDate(order.user.updatedAt),
//       },
//       garage: {
//         garageId: order.garage._id.toString(),
//         ...order.garage.toObject(), // Include other garage fields
//         createdAt: formatDate(order.garage.createdAt),
//         updatedAt: formatDate(order.garage.updatedAt),
//       },
//       typeOfCar: order.typeOfCar,
//       date: order.date,
//       timeRange: {
//         start: order.timeRange.start,
//         end: order.timeRange.end,
//       },
//       totalPrice: order.totalPrice,
//       duration: order.duration,
//       paymentMethod: order.paymentMethod,
//       isPaid: order.isPaid,
//       status: order.status,
//       startNow: order.startNow,
//       timeLeft: order.timeLeft,
//       qrCode: order.qrCode,
//       createdAt: formatDate(order.createdAt),
//       updatedAt: formatDate(order.updatedAt),
//     };
//     delete formattedOrder.user._id;
//     delete formattedOrder.garage._id;

//     res.status(200).json(formattedOrder);
//   }
// });

//    Get All  Order  //

// exports.getAllOrders = asyncHandler(async (req, res, next) => {
//   const {
//     "timeRange.start": timeRangeStart,
//     "timeRange.end": timeRangeEnd,
//     ...query
//   } = req.query;

//   let timeRangeQuery = {};

//   // Check if timeRangeStart and timeRangeEnd are provided
//   if (timeRangeStart && timeRangeEnd) {
//     // Parse the timeRangeStart and timeRangeEnd from the query string (hh:mm:ss am/pm format)
//     const startTime = moment(timeRangeStart, "hh:mm:ss A").toDate();
//     const endTime = moment(timeRangeEnd, "hh:mm:ss A").toDate();

//     // Validate if parsing was successful
//     if (
//       !startTime ||
//       !endTime ||
//       isNaN(startTime.getTime()) ||
//       isNaN(endTime.getTime())
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Invalid time format. Please use hh:mm:ss am/pm." });
//     }

//     // Build the timeRange query using the parsed Date objects
//     timeRangeQuery = {
//       "timeRange.start": { $gte: startTime },
//       "timeRange.end": { $lte: endTime },
//     };
//   }

//   // Merge the timeRangeQuery with the other query params
//   const finalQuery = { ...query, ...timeRangeQuery };

//   // Find the orders based on the query
//   const orders = await orderSchema.find(finalQuery).populate([
//     {
//       path: "user",
//       model: "Users",
//       select: "-__v ",
//     },
//     {
//       path: "garage",
//       model: "Garages",
//       select: "-__v ",
//     },
//   ]);

//   if (!orders || orders.length === 0) {
//     res.status(200).json({ "order Details": [] });
//   }

//   // Helper function to format date
//   const formatDate = (date) => moment(date).format("hh:mm A");

//   // Format each order
//   const formattedOrders = orders.map((order) => {
//     const formattedOrder = {
//       orderId: order._id.toString(),
//       user: order.user
//         ? {
//             userId: order.user._id.toString(),
//             ...order.user.toObject(),
//             createdAt: formatDate(order.user.createdAt),
//             updatedAt: formatDate(order.user.updatedAt),
//           }
//         : null,
//       garage: order.garage
//         ? {
//             garageId: order.garage._id.toString(),
//             ...order.garage.toObject(),
//             createdAt: formatDate(order.garage.createdAt),
//             updatedAt: formatDate(order.garage.updatedAt),
//           }
//         : null,
//       typeOfCar: order.typeOfCar,
//       date: order.date,
//       timeRange: order.timeRange
//         ? {
//             start: order.timeRange.start,
//             end: order.timeRange.end,
//           }
//         : null,
//       totalPrice: order.totalPrice,
//       duration: order.duration,
//       paymentMethod: order.paymentMethod,
//       isPaid: order.isPaid,
//       status: order.status,
//       startNow: order.startNow,
//       timeLeft: order.timeLeft,
//       qrCode: order.qrCode,
//       createdAt: formatDate(order.createdAt),
//       updatedAt: formatDate(order.updatedAt),
//     };

//     // Remove _id from user and garage objects if they exist
//     if (formattedOrder.user) delete formattedOrder.user._id;
//     if (formattedOrder.garage) delete formattedOrder.garage._id;

//     return formattedOrder;
//   });

//   // Send the formatted orders as the response
//   res.status(200).json({ "order Details": formattedOrders });
// });

exports.getAllOrders = asyncHandler(async (req, res, next) => {
  const { "timeRange.start": timeRangeStart, "timeRange.end": timeRangeEnd, dateGte, dateLte, ...query } = req.query;

  let timeRangeQuery = {};
  let dateRangeQuery = {};

  // Time range filtering logic
  if (timeRangeStart && timeRangeEnd) {
      const startTime = moment(timeRangeStart, 'hh:mm:ss A').toDate();
      const endTime = moment(timeRangeEnd, 'hh:mm:ss A').toDate();

      if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return res.status(400).json({ message: 'Invalid time format. Please use hh:mm:ss am/pm.' });
      }

      // Build the timeRange query
      timeRangeQuery = {
          "timeRange.start": { $gte: startTime },
          "timeRange.end": { $lte: endTime }
      };
  }

  // Date range filtering logic
  if (dateGte || dateLte) {
      const dateFilter = {};
      
      if (dateGte) {
          dateFilter.$gte = moment(dateGte, 'YYYY-MM-DD').startOf('day').toDate(); // Start of the day for gte
      }
      if (dateLte) {
          dateFilter.$lte = moment(dateLte, 'YYYY-MM-DD').endOf('day').toDate(); // End of the day for lte
      }

      dateRangeQuery = { createdAt: dateFilter };
  }

  const finalQuery = { ...query, ...timeRangeQuery, ...dateRangeQuery };

  // Fetch orders based on the final query
  const orders = await orderSchema.find(finalQuery).populate([
    {
      path: 'user',
      model: 'Users',
      select: '-__v '
    },
    {
      path: 'garage',
      model: 'Garages',
      select: '-__v '
    }
  ]);

  if (!orders || orders.length === 0) {
    return res.status(200).json({ "order Details": [] });
  }

  // Helper function to format date
  const formatDate = (date, format = 'YYYY-MM-DD h:mm A') => moment(date).format(format);

  // Format each order
  const formattedOrders = orders.map(order => {
    const user = order.user || {};
    const garage = order.garage || {}; // Ensure garage is an object

    return {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      user: user._id ? {
        userId: user._id.toString(),
        name: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        carName: user.carName || '',
        carNumber: user.carNumber || '',
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt)
      } : null, // Return null if user does not exist
      garage: garage._id ? { // Check if garage exists
        garageId: garage._id.toString(),
        garageImages: garage.garageImages || [], // Ensure garageImages is always an array
        garageName: garage.gragename || '',
        garageDescription: garage.grageDescription || '',
        garagePricePerHour: garage.gragePricePerHoure || 0,
        lat: garage.lat || 0,
        lng: garage.lng || 0,
        openDate: formatDate(garage.openDate, 'YYYY-MM-DD h:mm A'),
        endDate: formatDate(garage.endDate, 'YYYY-MM-DD h:mm A'),
        active: garage.active || false,
        createdAt: formatDate(garage.createdAt),
        updatedAt: formatDate(garage.updatedAt)
      } : null, // Return null if garage does not exist
      typeOfCar: order.typeOfCar || '',
      date: formatDate(order.date, 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'), // Ensure correct ISO formatting
      timeRange: {
        start: moment(order.timeRange.start).format('h:mm A'),
        end: moment(order.timeRange.end).format('h:mm A')
      },
      totalPrice: order.totalPrice || 0,
      duration: order.duration || 0,
      isPaid: order.isPaid,
      paymentMethod: order.paymentMethod || '',
      status: order.status || '',
      startNow: order.startNow || false,
      qrCode: order.qrCode || '',
      createdAt: formatDate(order.createdAt),
      updatedAt: formatDate(order.updatedAt)
    };
  });

  // Send the formatted orders as the response
  res.status(200).json({ "order Details": formattedOrders });
});

exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const foundOrder = await orderSchema.findById(req.params.orderId);
  if (!foundOrder) {
    return next(
      new ApiError(
        `could not found any order by this id ${req.params.orderId} `,
        404
      )
    );
  } else {
    if (foundOrder.timeRange.start < Date.now()) {
      const order = await orderSchema.findByIdAndUpdate(
        req.params.orderId,
        {
          status: "canceled",
        },
        { new: true }
      );

      res.status(200).json(order);
    } else {
      return next(new ApiError(`Sory, could not cancle this order `, 404));
    }
  }
});

//  Get User wallet //

exports.getUserWallet = asyncHandler(async (req, res, next) => {
  const user = await userSchema.findById(req.params.userId).populate("wallet");
  if (!user) {
    return next(
      new ApiError(
        `could not found any user by this id ${req.params.userId} `,
        404
      )
    );
  }
  if (!user.wallet) {
    // return next (new ApiError( `This user does not have wallet `,404))
    res.status(200).json({ message: "This user does not have wallet" });
  }
  res.status(200).json({ message: "This user have wallet", data: user.wallet });
});

// exports.getAllOrdersForSpecificUser = asyncHandler(async (req, res, next) => {
//   // Get the user ID from the decoded token
//   const userId = req.user._id;

//   // Extract timeRange parameters and query params
//   const {
//     "timeRange.start": timeRangeStart,
//     "timeRange.end": timeRangeEnd,
//     ...query
//   } = req.query;

//   let timeRangeQuery = {};

//   // Check if timeRangeStart and timeRangeEnd are provided
//   if (timeRangeStart && timeRangeEnd) {
//     const startTime = moment(timeRangeStart, "hh:mm:ss A").toDate();
//     const endTime = moment(timeRangeEnd, "hh:mm:ss A").toDate();

//     if (
//       !startTime ||
//       !endTime ||
//       isNaN(startTime.getTime()) ||
//       isNaN(endTime.getTime())
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Invalid time format. Please use hh:mm:ss am/pm." });
//     }

//     timeRangeQuery = {
//       "timeRange.start": { $gte: startTime },
//       "timeRange.end": { $lte: endTime },
//     };
//   }

//   // Add the userId from the token to the query
//   const finalQuery = { ...query, ...timeRangeQuery, user: userId };

//   // Find the orders based on the query
//   const orders = await orderSchema.find(finalQuery).populate({
//     path: "garage",
//     model: "Garages",
//     select: "-__v",
//   });

//   if (!orders || orders.length === 0) {
//     return res.status(200).json({ "order Details": [] });
//   }

//   // Helper function to format date
//   const formatDate = (date) => moment(date).format("hh:mm A");

//   // Format each order
//   const formattedOrders = orders.map((order) => {
//     const formattedOrder = {
//       orderId: order._id.toString(),
//       userId: req.user._id.toString(),
//       garage: order.garage,
//       typeOfCar: order.typeOfCar,
//       date: order.date,
//       timeRange: order.timeRange
//         ? {
//             start: order.timeRange.start,
//             end: order.timeRange.end,
//           }
//         : null,
//       totalPrice: order.totalPrice,
//       duration: order.duration,
//       paymentMethod: order.paymentMethod,
//       isPaid: order.isPaid,
//       status: order.status,
//       startNow: order.startNow,
//       timeLeft: order.timeLeft,
//       qrCode: order.qrCode,
//       createdAt: formatDate(order.createdAt),
//       updatedAt: formatDate(order.updatedAt),
//     };

//     // Remove _id from user and garage objects

//     if (formattedOrder.garage) delete formattedOrder.garage._id;

//     return formattedOrder;
//   });

//   // Send the formatted orders as the response
//   res.status(200).json({ "order Details": formattedOrders });
// });

////////////
// exports.getAllOrdersForSpecificUser = asyncHandler(async (req, res, next) => {
//   // Get the user ID from the decoded token
//   const userId = req.user._id;

//   // Extract timeRange parameters and query params
//   const { "timeRange.start": timeRangeStart, "timeRange.end": timeRangeEnd, ...query } = req.query;

//   let timeRangeQuery = {};

//   // Check if timeRangeStart and timeRangeEnd are provided
//   if (timeRangeStart && timeRangeEnd) {
//       const startTime = moment(timeRangeStart, 'hh:mm:ss A').toDate();
//       const endTime = moment(timeRangeEnd, 'hh:mm:ss A').toDate();

//       if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
//           return res.status(400).json({ message: 'Invalid time format. Please use hh:mm:ss am/pm.' });
//       }

//       timeRangeQuery = {
//           "timeRange.start": { $gte: startTime },
//           "timeRange.end": { $lte: endTime }
//       };
//   }

//   // Add the userId from the token to the query
//   const finalQuery = { ...query, ...timeRangeQuery, user: userId };

//   // Find the orders based on the query
//   const orders = await orderSchema.find(finalQuery).populate( {
//     path: 'garage',
//     model: 'Garages',
//     select: '-__v'
// });

//   if (!orders || orders.length === 0) {
//       return res.status(200).json({ "order Details": [] });
//   }

//   // Helper function to format date
//   const formatDate = (date) => moment(date).format('hh:mm A');

//   // Format each order
//   const formattedOrders = orders.map(order => {
//     const user = req.user || {};
//     const garage = order.garage || {}; // Ensure garage is an object
  
//     return {
//       orderId: order._id.toString(),
//       orderNumber: order.orderNumber,
//       user: req.user._id ? {
//         userId: user._id.toString(),
//         name: user.username || '',
//         email: user.email || '',
//         phone: user.phone || '',
//         carName: user.carName || '',
//         carNumber: user.carNumber || '',
//         createdAt: formatDate(user.createdAt),
//         updatedAt: formatDate(user.updatedAt)
//       } : null, // Return null if user does not exist
//       garage: garage._id ? { // Check if garage exists
//         garageId: garage._id.toString(), // Assign _id to garageId
//         garageImages: garage.garageImages || [], // Ensure garageImages is always an array
//         garageName: garage.gragename || '', // Fixed naming
//         garageDescription: garage.grageDescription || '', // Fixed naming
//         garagePricePerHour: garage.gragePricePerHoure || 0, // Fixed naming
//         lat: garage.lat || 0,
//         lng: garage.lng || 0,
//         openDate: formatDate(garage.openDate, 'YYYY-MM-DD h:mm A'),
//         endDate: formatDate(garage.endDate, 'YYYY-MM-DD h:mm A'),
//         active: garage.active || false,
//         createdAt: formatDate(garage.createdAt),
//         updatedAt: formatDate(garage.updatedAt)
//       } : null, // Return null if garage does not exist
//       typeOfCar: order.typeOfCar || '',
//       date: formatDate(order.date, 'YYYY-MM-DD'), // Ensure correct ISO formatting
//       timeRange: {
//         start: moment(order.timeRange.start).format('h:mm A'),
//         end: moment(order.timeRange.end).format('h:mm A')
//       },
//       totalPrice: order.totalPrice || 0,
//       duration: order.duration || 0,
//       paymentMethod: order.paymentMethod || '',
//       status: order.status || '',
//       startNow: order.startNow || false,
//       isPaid: order.isPaid || false,
//       qrCode: order.qrCode || '',
//       createdAt: formatDate(order.createdAt),
//       updatedAt: formatDate(order.updatedAt)
//     };
//   });

//   // Send the formatted orders as the response
//   res.status(200).json({ "order Details": formattedOrders });
// });
/////////////////

exports.getAllOrdersForSpecificUser = asyncHandler(async (req, res, next) => {
  // Get the user ID from the decoded token
  const userId = req.user._id;

  // Extract timeRange parameters and query params
  const { "timeRange.start": timeRangeStart, "timeRange.end": timeRangeEnd, ...query } = req.query;

  let timeRangeQuery = {};

  // Check if timeRangeStart and timeRangeEnd are provided
  if (timeRangeStart && timeRangeEnd) {
    const startTime = moment(timeRangeStart, 'hh:mm:ss A').toDate();
    const endTime = moment(timeRangeEnd, 'hh:mm:ss A').toDate();

    if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({ message: 'Invalid time format. Please use hh:mm:ss am/pm.' });
    }

    timeRangeQuery = {
      "timeRange.start": { $gte: startTime },
      "timeRange.end": { $lte: endTime }
    };
  }

  // Add the userId from the token to the query
  const finalQuery = { ...query, ...timeRangeQuery, user: userId };

  // Find the orders based on the query
  const orders = await orderSchema.find(finalQuery).populate({
    path: 'garage',
    model: 'Garages',
    select: '-__v'
  });

  if (!orders || orders.length === 0) {
    return res.status(200).json({ "order Details": [] });
  }

  // Helper function to format date
  const formatDate = (date) => moment(date).format('YYYY-MM-DD h:mm A');

  // Format each order
  const formattedOrders = orders.map(order => {
    const user = req.user || {};
    const garage = order.garage || {}; // Ensure garage is an object

    return {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber || 0, // Include the orderNumber
      user: req.user._id ? {
        userId: user._id.toString(),
        name: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        carName: user.carName || '',
        carNumber: user.carNumber || '',
        wallet: user.wallet || 0,
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt)
      } : null, // Return null if user does not exist
      garage: garage._id ? { // Check if garage exists
        garageId: garage._id.toString(), // Assign _id to garageId
        garageImages: garage.garageImages || [], // Ensure garageImages is always an array
        garageName: garage.gragename || '', // Fixed naming
        garageDescription: garage.grageDescription || '', // Fixed naming
        garagePricePerHour: garage.gragePricePerHoure || 0, // Fixed naming
        lat: garage.lat || 0,
        lng: garage.lng || 0,
        openDate: formatDate(garage.openDate),
        endDate: formatDate(garage.endDate),
        active: garage.active || false,
        createdAt: formatDate(garage.createdAt),
        updatedAt: formatDate(garage.updatedAt)
      } : null, // Return null if garage does not exist
      typeOfCar: order.typeOfCar || '',
      date: formatDate(order.date), // Ensure correct ISO formatting
      timeRange: {
        start: moment(order.timeRange.start).format('h:mm A'),
        end: moment(order.timeRange.end).format('h:mm A')
      },
      totalPrice: order.totalPrice || 0,
      duration: order.duration || 0,
      paymentMethod: order.paymentMethod || '',
      status: order.status || '',
      startNow: order.startNow || false,
      isPaid: order.isPaid || false,
      qrCode: order.qrCode || '',
      createdAt: formatDate(order.createdAt),
      updatedAt: formatDate(order.updatedAt)
    };
  });

  // Send the formatted orders as the response
  res.status(200).json({ "order Details": formattedOrders });
});

// exports.getAllOrdersForSpecificUser = asyncHandler(async (req, res, next) => {
//   // Get the user ID from the decoded token
//   const userId = req.user._id;

//   // Extract timeRange parameters and query params
//   const {
//     "timeRange.start": timeRangeStart,
//     "timeRange.end": timeRangeEnd,
//     ...query
//   } = req.query;

//   let timeRangeQuery = {};

//   // Check if timeRangeStart and timeRangeEnd are provided
//   if (timeRangeStart && timeRangeEnd) {
//     const startTime = moment(timeRangeStart, "hh:mm:ss A").toDate();
//     const endTime = moment(timeRangeEnd, "hh:mm:ss A").toDate();

//     if (
//       !startTime ||
//       !endTime ||
//       isNaN(startTime.getTime()) ||
//       isNaN(endTime.getTime())
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Invalid time format. Please use hh:mm:ss am/pm." });
//     }

//     timeRangeQuery = {
//       "timeRange.start": { $gte: startTime },
//       "timeRange.end": { $lte: endTime },
//     };
//   }

//   // Add the userId from the token to the query
//   const finalQuery = { ...query, ...timeRangeQuery, user: userId };

//   // Find the orders based on the query
//   const orders = await orderSchema.find(finalQuery).populate({
//     path: "garage",
//     model: "Garages",
//     select: "name lat lng", // Select fields without excluding __v
//   });
//   // const orders = await orderSchema.find({ user: userId }).select('garage').exec();

//   if (!orders || orders.length === 0) {
//     return res.status(200).json({ "order Details": [] });
//   }

//   // Helper function to format date
//   const formatDate = (date) => moment(date).format("hh:mm A");

//   // Calculate the number of hours from the time range
//   const calculateNumberOfHours = (start, end) => {
//     const startTime = moment(start);
//     const endTime = moment(end);
//     return endTime.diff(startTime, 'hours', true); // true for floating point
//   };

//   // Format each order
//   const formattedOrders = orders.map((order) => {
//     const numberOfHours = order.timeRange
//       ? calculateNumberOfHours(order.timeRange.start, order.timeRange.end)
//       : null;

//     const formattedOrder = {
//       orderId: order._id.toString(),
//       userId: req.user._id.toString(),
//       typeOfCar: order.typeOfCar,
//       date: order.date,
//       timeRange: order.timeRange
//         ? {
//             start: order.timeRange.start,
//             end: order.timeRange.end,
//           }
//         : null,
//       totalPrice: order.totalPrice,
//       numberOfHours: numberOfHours,
//       paymentMethod: order.paymentMethod,
//       isPaid: order.isPaid,
//       status: order.status,
//       startNow: order.startNow,
//       timeLeft: order.timeLeft,
//       qrCode: order.qrCode,
//       createdAt: formatDate(order.createdAt),
//       updatedAt: formatDate(order.updatedAt),
//       garage: order.garage
//         ? {
//             garageId: order.garage._id.toString(),
//             garageName: order.garage.name,
//             lat: order.garage.lat,
//             lng: order.garage.lng,
//           }
//         : null,
//     };

//     return formattedOrder;
//   });

//   // Send the formatted orders as the response
//   res.status(200).json({ "order Details": formattedOrders });
// });
