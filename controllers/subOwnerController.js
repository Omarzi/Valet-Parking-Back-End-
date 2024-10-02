const attendnceSchema = require("../models/attendanceModel");
const moment = require('moment');
const formatDate = require("../middleware/formatDateMiddleware");




// exports.getAttendanceStartIn = async (req, res, next) => {
//   try {
//     const { startIn, status } = req.query;

//     // Build the query object
//     let query = {};

//     // Handle date filtering if startIn is provided
//     if (startIn) {
//       const parsedStartIn = new Date(startIn);
      
//       // Check if the parsed date is valid
//       if (isNaN(parsedStartIn.getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid date format for startIn',
//         });
//       }
      
//       query.startIn = { $gte: parsedStartIn }; // Filtering for startIn greater than or equal to the specified date
//     }

//     // Handle status filtering if provided
//     if (status) {
//       query.status = status;
//     }

//     // Fetch attendance records based on the query
//     const attendances = await attendnceSchema.find(query)
//       .populate('admin', 'name email') // Include admin email as well
//       .populate('garage', 'gragename grageDescription gragePricePerHoure garageImages lat lng openDate endDate active') // Populate garage details
//       .exec();

//     // Format response
//     const formattedAttendances = attendances.reduce((acc, attendance) => {
//       const startInFormatted = moment(attendance.startIn).isValid() ? formatDate(attendance.startIn) : null;
//       const dateFormatted = moment(attendance.date).isValid() ? moment(attendance.date).format('YYYY-MM-DD') : 'Invalid date';
    
//       const garage = attendance.garage; // Assuming garage is populated
    
//       // Only include the object if startIn is valid and admin is defined
//       if (startInFormatted && attendance.admin) {
//         acc.push({
//           attendanceId: attendance._id.toString(),
//           driver: {
//             driverId: attendance.admin._id.toString(),
//             email: attendance.admin.email,
//             lat: attendance.lat,
//             lng: attendance.lng,
//             startIn: startInFormatted,
//             date: dateFormatted,  // Use the formatted date
//             status: attendance.status,
//             createdAt: formatDate(attendance.createdAt),
//             updatedAt: formatDate(attendance.updatedAt),
//           },
//           garage: garage ? {
//             garageId: garage._id.toString(),
//             garageName: garage.gragename,
//             garageDescription: garage.grageDescription,
//             garagePricePerHour: garage.gragePricePerHoure,
//             garageImages: garage.garageImages || [],
//             lat: garage.lat,
//             lng: garage.lng,
//             openDate: formatDate(garage.openDate),
//             endDate: formatDate(garage.endDate),
//             active: garage.active,
//             createdAt: formatDate(garage.createdAt),
//             updatedAt: formatDate(garage.updatedAt),
//           } : null, // Ensure garage is defined
//           status: attendance.status,
//           createdAt: formatDate(attendance.createdAt),
//           updatedAt: formatDate(attendance.updatedAt),
//         });
//       }
    
//       return acc;
//     }, []);
    

//     res.status(200).json({
//       success: true,
//       count: formattedAttendances.length,
//       data: formattedAttendances,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//     });
//   }
// };
  
exports.getAttendanceStartIn = async (req, res, next) => {
  try {
    const { startIn, status, createdAt } = req.query;

    // Build the query object
    let query = {};

    // Handle date filtering if startIn is provided
    if (startIn) {
      const parsedStartIn = new Date(startIn);
      
      // Check if the parsed date is valid
      if (isNaN(parsedStartIn.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format for startIn',
        });
      }
      
      query.startIn = { $gte: parsedStartIn }; // Filtering for startIn greater than or equal to the specified date
    }

    // Handle createdAt range filtering if provided
    if (createdAt) {
      query.createdAt = {};

      if (createdAt.gte) {
        const startDate = new Date(createdAt.gte);
        if (!isNaN(startDate.getTime())) {
          query.createdAt.$gte = startDate; // Add $gte filter
        }
      }

      if (createdAt.lte) {
        const endDate = new Date(createdAt.lte);
        if (!isNaN(endDate.getTime())) {
          query.createdAt.$lte = endDate; // Add $lte filter
        }
      }
    }

    // Handle status filtering if provided
    if (status) {
      query.status = status;
    }

    // Fetch attendance records based on the query
    const attendances = await attendnceSchema.find(query)
      .populate('admin', 'name email') // Include admin email as well
      .populate('garage', 'gragename grageDescription gragePricePerHoure garageImages lat lng openDate endDate active') // Populate garage details
      .exec();

    // Format response
    const formattedAttendances = attendances.reduce((acc, attendance) => {
      const startInFormatted = moment(attendance.startIn).isValid() ? formatDate(attendance.startIn) : null;
      const dateFormatted = moment(attendance.date).isValid() ? moment(attendance.date).format('YYYY-MM-DD') : 'Invalid date';
    
      const garage = attendance.garage; // Assuming garage is populated
    
      // Only include the object if startIn is valid and admin is defined
      if (startInFormatted && attendance.admin) {
        acc.push({
          attendanceId: attendance._id.toString(),
          driver: {
            driverId: attendance.admin._id.toString(),
            email: attendance.admin.email,
            lat: attendance.lat,
            lng: attendance.lng,
            startIn: startInFormatted,
            date: dateFormatted,  // Use the formatted date
            status: attendance.status,
            createdAt: formatDate(attendance.createdAt),
            updatedAt: formatDate(attendance.updatedAt),
          },
          garage: garage ? {
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
          } : null, // Ensure garage is defined
          status: attendance.status,
          createdAt: formatDate(attendance.createdAt),
          updatedAt: formatDate(attendance.updatedAt),
        });
      }
    
      return acc;
    }, []);
    

    res.status(200).json({
      success: true,
      count: formattedAttendances.length,
      data: formattedAttendances,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

  
  
exports.getAttendanceEndIn = async (req, res, next) => {
  try {
    const { endIn, status } = req.query;

    // Build the query object
    let query = {};

    // Handle endIn range filtering if provided
    if (endIn) {
      query.endIn = {};

      // Check if endIn[gte] (greater than or equal to) is provided
      if (endIn.gte) {
        const startDate = new Date(endIn.gte);
        if (!isNaN(startDate.getTime())) {
          query.endIn.$gte = startDate; // Add $gte filter for endIn
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid date format for endIn[gte]',
          });
        }
      }

      // Check if endIn[lte] (less than or equal to) is provided
      if (endIn.lte) {
        const endDate = new Date(endIn.lte);
        if (!isNaN(endDate.getTime())) {
          query.endIn.$lte = endDate; // Add $lte filter for endIn
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid date format for endIn[lte]',
          });
        }
      }
    }

    // Handle status filtering if provided
    if (status) {
      query.status = status;
    }

    // Fetch attendance records based on the query
    const attendances = await attendnceSchema.find(query)
      .populate('admin', 'name email') // Populate admin name and email
      .populate('garage', 'gragename grageDescription gragePricePerHoure garageImages lat lng openDate endDate active') // Populate garage details
      .exec();

    // Format response
    const formattedAttendances = attendances.reduce((acc, attendance) => {
      const endInFormatted = moment(attendance.endIn).isValid() ? formatDate(attendance.endIn) : null;
      const dateFormatted = moment(attendance.date).isValid() ? moment(attendance.date).format('YYYY-MM-DD') : 'Invalid date';

      const garage = attendance.garage; // Assuming garage is populated

      // Only include the object if endIn is valid and admin is defined
      if (endInFormatted && attendance.admin) {
        acc.push({
          attendanceId: attendance._id.toString(),
          driver: {
            driverId: attendance.admin._id.toString(),
            email: attendance.admin.email,
            lat: attendance.lat,
            lng: attendance.lng,
            endIn: endInFormatted,
            date: dateFormatted,  // Use the formatted date
            status: attendance.status,
            createdAt: formatDate(attendance.createdAt),
            updatedAt: formatDate(attendance.updatedAt),
          },
          garage: garage ? {
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
          } : null, // Ensure garage is defined
          status: attendance.status,
          createdAt: formatDate(attendance.createdAt),
          updatedAt: formatDate(attendance.updatedAt),
        });
      }

      return acc;
    }, []);

    res.status(200).json({
      success: true,
      count: formattedAttendances.length,
      data: formattedAttendances,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
  

//   exports.getAttendanceEndIn = async (req, res, next) => {
//     try {
//         const { endIn, status } = req.query;

//         // Build the query object
//         let query = {};

//         // Handle date filtering if endIn is provided
//         if (endIn) {
//             const parsedEndIn = new Date(endIn);

//             // Check if the parsed date is valid
//             if (isNaN(parsedEndIn.getTime())) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Invalid date format for endIn',
//                 });
//             }

//             query.endIn = { $lte: parsedEndIn }; // Filtering for endIn
//         }

//         // Handle status filtering if provided
//         if (status) {
//             query.status = status;
//         }

//         // Fetch attendance records based on the query
//         const attendances = await attendnceSchema.find(query)
//             .populate('admin', 'name') // Assuming you want to populate admin's name
//             .exec();

//         // Format response
//         const formattedAttendances = attendances.reduce((acc, attendance) => {
//             const endInFormatted = moment(attendance.endIn).isValid() ? formatDate(attendance.endIn) : null;
//             const dateFormatted = moment(attendance.date).isValid() ? moment(attendance.date).format('YYYY-MM-DD') : 'Invalid date';
          
//             const garage = attendance.garage; // Assuming garage is populated
          
//             // Only include the object if startIn is valid and admin is defined
//             if (endInFormatted && attendance.admin) {
//               acc.push({
//                 attendanceId: attendance._id.toString(),
//                 driver: {
//                   driverId: attendance.admin._id.toString(),
//                   email: attendance.admin.email,
//                   lat: attendance.lat,
//                   lng: attendance.lng,
//                   endIn: endInFormatted,
//                   date: dateFormatted,  // Use the formatted date
//                   status: attendance.status,
//                   createdAt: formatDate(attendance.createdAt),
//                   updatedAt: formatDate(attendance.updatedAt),
//                 },
//                 garage: garage ? {
//                   garageId: garage._id.toString(),
//                   garageName: garage.gragename,
//                   garageDescription: garage.grageDescription,
//                   garagePricePerHour: garage.gragePricePerHoure,
//                   garageImages: garage.garageImages || [],
//                   lat: garage.lat,
//                   lng: garage.lng,
//                   openDate: formatDate(garage.openDate),
//                   endDate: formatDate(garage.endDate),
//                   active: garage.active,
//                   createdAt: formatDate(garage.createdAt),
//                   updatedAt: formatDate(garage.updatedAt),
//                 } : null, // Ensure garage is defined
//                 status: attendance.status,
//                 createdAt: formatDate(attendance.createdAt),
//                 updatedAt: formatDate(attendance.updatedAt),
//               });
//             }
          
//             return acc;
//           }, []);
          

//         res.status(200).json({
//             success: true,
//             count: formattedAttendances.length,
//             data: formattedAttendances,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//         });
//     }
// };