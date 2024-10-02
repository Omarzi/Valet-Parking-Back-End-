class ApiFeatures {
    constructor(queryString,mongooseQuery){
        this.queryString =queryString
        this.mongooseQuery = mongooseQuery
     }

     // Filtering
    filter(){
        
        const queryStringObj = {...this.queryString}
        const excludesFields = ["page", "limit","sort","fields"]
         excludesFields.forEach((field) => delete queryStringObj[field]);
         // Appling Filtering using { gte , gt , lte , lt}
         let queryStr = JSON.stringify(queryStringObj)
         queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g,(match)=>`$${match}`)
         
        this.mongooseQuery =this.mongooseQuery.find(JSON.parse(queryStr))
    
        return this;
        }


  search(){
        if(this.queryString.keyword){
        let query = {};
        
            
        query= {gragename:{ $regex :this.queryString.keyword , $options:'i'}}
                
         
        this.mongooseQuery =this.mongooseQuery.find(query)
            }
            return this
           }
}

module.exports = ApiFeatures;

