const globalError = (err, req , res ,next)=> {
    err.statusCode = err.statusCode||500
    err.status = err.status||'error'
    if(process.env.NODE_ENV == "development"){
        sendErrorforDev(err,res)
    }else{
        sendErrorforPro(err,res)
    }

};

const sendErrorforDev = (err,res)=>{
    return res.status(err.statusCode).json({
        status:err.status,
        error:err,
        message:err.message,
        stack:err.stack

    })
};
const sendErrorforPro = (err , res)=>{
    return res.status(err.statusCode).json({
        status:err.status,
        message:err.message
        

    })
}




module.exports = globalError;