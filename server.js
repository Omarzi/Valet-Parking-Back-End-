const express = require('express');
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const DB = require("./config/DB")
const globalError =require("./middleware/errorMiddleware")
const ApiError = require("./utils/apiError")


app.use(express.json());
app.use(cors());


app.use("/auth",require("./routers/authRoute"))
app.use("/user",require("./routers/userRoure"))
app.use("/driver",require("./routers/driverRout"))
app.use("/owner",require("./routers/ownerRoute"))
app.use("/subOwner",require("./routers/subOwnerRoute"))



app.use('*', (req,res,next) => {
    next( new ApiError(`Can't find this route : ${req.originalUrl}`,404))
})

// Global erroe handling middleware for express//
app.use(globalError)





DB().then((connect)=> {
    server.listen(process.env.PORT, ()=> {
        console.log(`Server running on port ${process.env.PORT} on DB ${connect.connection.host}`);
    })
})



// handling rejection outside express//
process.on('unhandledRejection',(err)=>{
    console.error(`UnhandledRejection Error : ${err.name} | ${err.message}`);
    server.close(()=>{
        console.error("shuttind down")
        process.exit(1);
    })
});