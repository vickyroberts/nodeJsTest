var mongoose = require("mongoose");
//Schema for storing user secrets
var userSecSchema = mongoose.Schema;
//Schema for storing User details
var userSchema = mongoose.Schema;

//Create the usersecurity collection that will save the user credential details.
//This function will also add a default superuser entry.	
var securedUserSchema = new userSecSchema({
	userId: Number,
	extId: Number,
	passwords: [{password:String,passwordCreatedDate:{type:Date, default:Date.now}}],
	createdDate: {type:Date, default:Date.now}
});

module.exports = mongoose.model('userSecurity',securedUserSchema)

