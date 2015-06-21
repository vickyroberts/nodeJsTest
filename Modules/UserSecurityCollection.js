var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');
//Schema for storing user secrets
var userSecSchema = mongoose.Schema;
var logger = require("../logger");

//Create the usersecurity collection that will save the user credential details.
//This function will also add a default superuser entry.	
var securedUserSchema = new userSecSchema({
	userId: {type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
	userName: {type: String, required:true, unique:true, index:true},
	password: {type: String, required:true},
	extId: {type:String, index:true},
	oldPasswords: [{password:String,passwordCreatedDate:{type:Date, default:Date.now}}],
	status:{type:Boolean, default:true},
	createdDate: {type:Date, default:Date.now}
});

securedUserSchema.methods.verifyPassword = function(password, cb) 
{
  logger.debug("Verify Password");
  bcrypt.compare(password, this.password, function(err, isMatch) 
   {
    if (err) 
	{ 
		return cb(err);
		logger.debug("Verify Password failed for password - " + password);
	}
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('UserSecurity',securedUserSchema,'UserSecurityCollection')

