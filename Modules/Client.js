// Load required packages
var mongoose = require("mongoose");
//Schema for storing user secrets
var clientSchema = mongoose.Schema;

// Define our client schema
var ClientSchemaObj = new clientSchema({
  name: { type: String, unique: true, required: true },
  id: { type: String, required: true },
  secret: { type: String, required: true },
  userId: { type: String, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('ClientCollection', ClientSchemaObj, 'ClientCollection');