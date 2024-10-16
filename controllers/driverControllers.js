const asyncHandler = require("express-async-handler");
const garageSchema = require("../models/garageModel")
const userSchema = require("../models/authModel");
const orderSchema = require("../models/oderModel")
const attendnceSchema = require("../models/attendanceModel");
const adminSchema = require("../models/adminModel")
const ApiError = require("../utils/apiError");
const moment = require('moment');
const formatDate = require("../middleware/formatDateMiddleware");
const { request } = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")

  ///   Make garage active or not   //

//   exports.activeGarage = asyncHandler(async (req, res, next) => {
//     const garage = await garageSchema.findByIdAndUpdate(
//         req.params.garageId,
//         {active:req.body.active }, {new : true}
        
//     );

//     if (!garage) {
//         return res.status(404).json({
//             status: "Error",
//             message: "garage not found"
//         });
//     }
//     const formattedGarage = {        driver: garage.driver || [],
//       subOwner: garage.subOwner || [],
//       garageId: garage._id.toString(), // Format _id as a string
//       gragename: garage.gragename || '',
//       grageDescription: garage.grageDescription || '',
//       grageImages: garage.grageImages || '',
//       gragePricePerHoure: garage.gragePricePerHoure || 0,
//       lat: garage.lat || 0,
//       lng: garage.lng || 0,
//       openDate:formatDate(garage.createdAt),
//       endDate: formatDate(garage.updatedAt) ,/// Format ISO 8601
//       active: garage.active || false,
//       createdAt: formatDate(garage.createdAt),
//       updatedAt: formatDate(garage.updatedAt) }

//       let message ="Garage added successfully to your active list"

//       if(req.body.active === false){
//         message=="Garage removed successfully from your active list"
//       }

//     res.status(200).json({
//         status: "Success",
//         message: message,
//         data: formattedGarage
//     });
// });

exports.activeGarage = asyncHandler(async (req, res, next) => {
  const garage = await garageSchema.findByIdAndUpdate(
    req.params.garageId,
    { active: req.body.active },
    { new: true }
  );

  if (!garage) {
    return res.status(404).json({
      status: "Error",
      message: "Garage not found",
    });
  }

  // Set the correct message based on the active status
  let message = "Garage added successfully to your active list";
  if (req.body.active === false) {
    message = "Garage removed successfully from your active list";
  }

  // Format the garage object
  const formattedGarage = {
    driver: garage.driver || [],
    subOwner: garage.subOwner || [],
    garageId: garage._id.toString(),
    garageName: garage.garageName || '',
    garageDescription: garage.garageDescription || '',
    garageImages: garage.garageImages || [],
    garagePricePerHour: garage.garagePricePerHour || 0,
    lat: garage.lat || 0,
    lng: garage.lng || 0,
    openDate: formatDate(garage.openDate),
    endDate: formatDate(garage.endDate),
    active: garage.active || false,
    createdAt: formatDate(garage.createdAt),
    updatedAt: formatDate(garage.updatedAt),
  };

  // Send the response
  res.status(200).json({
    status: "Success",
    message: message,
    data: formattedGarage,
  });
});



///       Add New User   //

exports.addNewUser = asyncHandler(async(req , res , next) => {
    const foundUser  = await userSchema.findOne({phone : req.body.phone})
    
        if(foundUser){
            throw new ApiError("this user is already exist .",404)
       }
       else{  
        const user = await userSchema.create({
          phone: req.body.phone,
            password: req.body.password
        })

        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET_KEY,
          { expiresIn: process.env.JWT_EXPIRE_TIME }
      );
        
        const formattedUser = {
          userId: user._id.toString(), 
          phone: user.phone,
          password:user.password,
          createdAt: formatDate(user.createdAt),
          updatedAt: formatDate(user.updatedAt)
      };
        res.status(200).json({userData: formattedUser, token})
       }
    
})





// exports.takeAttendanceStartIn = asyncHandler(async (req, res, next) => {
//   try {
//     // Get the garage ID and startIn from the request body
//     const { garageId } = req.body;
    
//     // Fetch the garage
//     const garage = await garageSchema.findById(garageId);
//     if (!garage) {
//       return res.status(404).json({ message: 'Garage not found' });
//     }

//     // Convert startIn and garage.openDate to Date objects
//     const startDate = Date.now();
//     const garageStartDate = new Date(garage.openDate);

//     // Determine status based on comparison
//     let status = 'present'; // Default to 'present' if not late
//     if (startDate > garageStartDate) {
//       status = 'late';
//     }

//     // Create attendance record
//     const attendance = await attendnceSchema.create({
//       admin: req.admin._id,
//       lat: req.body.lat,
//       lng: req.body.lng,
//       startIn: startDate,
//       endIn: null,
//       status,
//       garageId:garage
//     });

//     // Format the response
//     const formatAttendance = {
//       attendanceId: attendance._id.toString(), // Convert ObjectId to string
//       lat: attendance.lat,
//       lng: attendance.lng,
//       startIn: formatDate(startDate),
//       endIn: null,
//       status,
//       createdAt: formatDate(attendance.createdAt),
//       updatedAt: formatDate(attendance.updatedAt) 
//     };

//     res.status(200).json({ formatAttendance });
//   } catch (error) {
//     next(error); // Handle any errors
//   }
// });



//   exports.takeAttendancesEndIn = asyncHandler(async(req , res , next) => {
//     try {
//         // Get the garage ID and startIn from the request body
//         const { garageId, lat, lng } = req.body;
        
//         // Fetch the garage start time
//         const garage = await garageSchema.findById(garageId);
//         if (!garage) {
//           return res.status(404).json({ message: 'Garage not found' });
//         }
    
//         // Convert startIn and garage.openDate to Date objects
//         const endDate = Date.now();
//         const garageStartDate = new Date(garage.endDate);
    
        
    
//         // Determine status based on comparison
//         let status = 'present'; // Default to 'present' if not late
//         if (startDate > garageStartDate) {
//           status = 'late';
//         }
    
//         // Create attendance record
//         const attendance = await attendnceSchema.create({
//           admin: req.admin._id,
//           lat,
//           lng,
//           startIn: null,
//           endIn: endDate,
//           status
//         });
//         const formatAttendance = {
//           attendanceId: attendance._id.toString(), // Convert ObjectId to string
//           lat: attendance.lat,
//           lng: attendance.lng,
//           startIn: null,
//           endtIn: formatDate(endDate),
//           status,
//           createdAt: formatDate(attendance.createdAt),
//           updatedAt: formatDate(attendance.updatedAt) 
//         };
    
//         res.status(200).json({ formatAttendance });
    
//       } catch (error) {
//         next(error); // Handle any errors
//       }
//   })

const formatAttendanceResponse = (attendance, admin, garage, startDate, endDate) => {
  return {
    attendanceId: attendance._id.toString(),
    driver: {
      driverId: admin._id.toString(),
      email: admin.email,
      lat: attendance.lat,
      lng: attendance.lng,
      startIn: formatDate(attendance.startIn),
      date: moment(new Date(attendance.date)).format('YYYY-MM-DD'),
      status: attendance.status,
      createdAt: formatDate(attendance.createdAt),
      updatedAt: formatDate(attendance.updatedAt),
    },
    garage: {
      garageId: garage._id.toString(),
      garageName: garage.gragename,
      garageDescription: garage.grageDescription,
      garagePricePerHour: garage.gragePricePerHoure,
      garageImages: garage.garageImages || [],
      lat: garage.lat,
      lng: garage.lng,
      openDate: formatDate(garage.openDate),
      endDate: formatDate(garage.endDate),
      active: garage.active,
      createdAt: formatDate(garage.createdAt),
      updatedAt: formatDate(garage.updatedAt),
    },
    startIn: startDate ? formatDate(startDate) : null,
    endIn: endDate ? formatDate(endDate) : null,
    date: moment(new Date(startDate || endDate)).format('YYYY-MM-DD'),
    status: attendance.status,
    createdAt: formatDate(attendance.createdAt),
    updatedAt: formatDate(attendance.updatedAt),
  };
};


exports.takeAttendanceStartIn = asyncHandler(async (req, res, next) => {
  try {
    const { garageId, lat, lng } = req.body;

    const garage = await garageSchema.findById(garageId);
    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' });
    }

    const startDate = Date.now();
    const garageStartDate = new Date(garage.openDate);
    const status = startDate > garageStartDate ? 'late' : 'present';

    const attendance = await attendnceSchema.create({
      admin: req.admin._id,
      lat,
      lng,
      startIn: startDate,
      endIn: null,
      date: startDate,
      status,
      garage: garageId,
    });

    const populatedAttendance = await attendnceSchema
      .findById(attendance._id)
      .populate('admin', '-__v')
      .populate('garage', '-__v');

    const formatAttendance = formatAttendanceResponse(
      populatedAttendance,
      populatedAttendance.admin,
      populatedAttendance.garage,
      startDate,
      null
    );

    res.status(200).json({ formatAttendance });
  } catch (error) {
    next(error);
  }
});

exports.takeAttendancesEndIn = asyncHandler(async (req, res, next) => {
  try {
    const { garageId, lat, lng } = req.body;

    const garage = await garageSchema.findById(garageId);
    if (!garage) {
      return res.status(404).json({ message: 'Garage not found' });
    }

    const endDate = Date.now();
    const garageEndDate = new Date(garage.endDate);
    const status = endDate > garageEndDate ? 'late' : 'present';

    const attendance = await attendnceSchema.create({
      admin: req.admin._id,
      lat,
      lng,
      startIn: null,
      endIn: endDate,
      date: endDate,
      status,
      garage: garageId,
    });

    const populatedAttendance = await attendnceSchema
      .findById(attendance._id)
      .populate('admin', '-__v')
      .populate('garage', '-__v');

    const formatAttendance = formatAttendanceResponse(
      populatedAttendance,
      populatedAttendance.admin,
      populatedAttendance.garage,
      null,
      endDate
    );

    res.status(200).json({ formatAttendance });
  } catch (error) {
    next(error);
  }
});



  // exports.updteOrder = asyncHandler(async(req, res, next) => {
  //   const order = await orderSchema.findByIdAndUpdate(req.params.orderId , {
  //       Date: req.body.Date,
  //       timeRange: req.body.timeRange,
  //       totalPrice: req.body.totalPrice,
  //       duration: req.body.duration,
  //       paymentMethod: req.body.paymentMethod,
  //       isPaid: req.body.isPaid,
  //       status: req.body.status
  //   } , {new : true})
  //   if(!order){
  //       return next (new ApiError(`could not found any order by this id ${req.params.orderId} `,404))   

  //   }
  //   else{
  //       res.status(200).json(order)
  //   }
  // })



exports.updteOrder = asyncHandler(async(req, res, next) => {
    const { timeRange } = req.body;

    let start, end;

    if (timeRange) {
        // Convert the timeRange to Date objects
        start = moment(timeRange.start, 'hh:mm A').toDate();
        end = moment(timeRange.end, 'hh:mm A').toDate();
    }

    const order = await orderSchema.findByIdAndUpdate(req.params.orderId, {
        date: req.body.date,
        timeRange: timeRange ? { start, end } : undefined, // Update only if timeRange is provided
        totalPrice: req.body.totalPrice,
        duration: req.body.duration,
        paymentMethod: req.body.paymentMethod,
        isPaid: req.body.isPaid,
        status: req.body.status
    }, { new: true });

    if (!order) {
        return next(new ApiError(`Could not find any order with this ID: ${req.params.orderId}`, 404));
    } else {
        res.status(200).json(order);
    }
});




exports.getProfile = asyncHandler(async(req , res , next) => {
  const {adminId} = req.params
  const admin = await adminSchema.findById(adminId)
  if(!admin){
      return next (new ApiError(`could not found admin by this id ${req.params.adminId} `,404))
  }

  const formattedAdmin = {
    adminId: admin._id, // Use `_id` for adminId
    email: admin.email,
    password: admin.password,
    lat: admin.lat,
    lng: admin.lng,
    salary: admin.salary,
    role: admin.role,
    garage: admin.garage,
    createdAt: formatDate(admin.createdAt),
    updatedAt: formatDate(admin.updatedAt)
};
  delete admin._doc.password && delete admin._doc.__v
  res.status(200).json(formattedAdmin)
})



exports.makeScan = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  // Validate if orderId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({
      message: "Invalid orderId format. Must be a 24-character hexadecimal string.",
    });
  }

  try {
    // Fetch the order by ID
    const order = await orderSchema.findById(orderId);

    // Check if the order exists
    if (!order) {
      return res.status(422).json({
        message: "Order not found",
      });
    }

    // Check the current status of the order
    if (order.status === "ongoing") {
      // Update the order status to 'completed'
      order.status = "completed";
      await order.save(); // Save the updated order

      return res.status(200).json({
        message: "Order status updated to completed.",
        order,
      });
    } else if (order.status === "completed") {
      return res.status(422).json({
        message: "This order has already been completed.",
      });
    } else if (order.status === "canceled") {
      return res.status(422).json({
        message: "This order has been canceled.",
      });
    } else {
      return res.status(422).json({
        message: "Invalid order status.",
      });
    }
  } catch (err) {
    console.error("Error fetching order:", err); // Log the error for debugging
    return next(
      new ApiError(`Error fetching order: ${err.message}`, 500)
    ); // Return more detailed error
  }
});
