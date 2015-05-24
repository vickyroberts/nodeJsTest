var mongoose = require("mongoose");
//Schema for storing user secrets
var userSchema = mongoose.Schema;

//Create the User collection that will save the user details.
//This function will also add a default superuser entry.	
var userDetailsSchema = new userSchema({
	userId: Number,	
	userName: String,
	firstName: String,
	lastName: String,
	address: [{addressLine:String,city:String,state:String,country:String,isCurrentAddress:Boolean}],
	accountType: String,
	education: [{highestDegree:String,collegeName:String,location:String}],
	userTagValues:{qualification:[String],profession:String,skills:[String],jobLocationPref:[String],matriExpectedQualification:[String],matriExpectedJob:[String],matriExpectedPreferedLocation:[String]},
	groupsTaggedTo:[Number],
	isSuperUser:Boolean,
	status:Boolean,
	createdDate: {type:Date, default:Date.now}
});
module.exports = mongoose.model('userDetails',userDetailsSchema);