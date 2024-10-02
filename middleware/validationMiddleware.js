// const { validationResult} = require("express-validator")

// const validatorMiddleware = (req , res , next) => {
//     const errors = validationResult(req)

//     if(!errors.isEmpty()){
//         return res.status(422).json({
//             errors:errors.array()
//         })
//     }
//     else{
//         next();
//     }
// }

// module.exports = validatorMiddleware;

const { validationResult } = require("express-validator");
const ApiError = require('../utils/apiError');

const validatorMiddleware = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Extract first error (if any) for simplicity
        const firstError = errors.array()[0];
        return next(new ApiError(firstError.msg, 422, firstError.value));
    }
    
    next();
};

module.exports = validatorMiddleware;
