const mongoose = require ('mongoose')

const userSchema = mongoose.Schema({
    // nop considere en el esquema el _id
    // porque Mongodb automáticamente lo agrega 
    //para cada documento en una colección
   
    email : {
        type : String,
        required: true
    },
    password : {
        type : String,
        required: true
    },
    role : {
        type : String,
        enum : ["admin", "waiter", "chef"],
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);