const config = require('./config');
// eslint-disable-next-line no-unused-vars
const { dbUrl } = config;
const mongoose = require('mongoose')

// Connection URL
async function connect() {
  // TODO: Database Connection
  try {
    await mongoose.connect(dbUrl);
    console.log('conexion correcta');
    return mongoose.connection;
  } catch (error) { 
    console.log("🚀 ~ connect ~ error:", error)
    
  }
}

module.exports = { connect };
