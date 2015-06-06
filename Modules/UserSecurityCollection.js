var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');
//Schema for storing user secrets
var userSecSchema = mongoose.Schema;


//Create the usersecurity collection that will save the user credential details.
//This function will also add a default superuser entry.	
var securedUserSchema = new userSecSchema({
	userId: {type:Number, index:true},
	userName: {type: String, required:true, unique:true, index:true},
	password: {type: String, required:true},
	extId: {type:Number, index:true},
	oldPasswords: [{password:String,passwordCreatedDate:{type:Date, default:Date.now}}],
	createdDate: {type:Date, default:Date.now}
});

securedUserSchema.methods.verifyPassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('UserSecurity',securedUserSchema,'UserSecurityCollection')

