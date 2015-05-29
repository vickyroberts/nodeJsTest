var mongoose = require("mongoose");
//Schema for storing user secrets
var groupSchema = mongoose.Schema;

//Create the usersecurity collection that will save the user credential details.
//This function will also add a default superuser entry.	
var groupCollection = new groupSchema({
	groupId: Number,
	groupName: String,
	groupType: String,
	description: String,
	pictures:[{fileName:String,filePath:String,fileType:String}],
	userIds: [Number],	
	displayAdminDetails:{type:Boolean, default:true},
	status: Boolean,
	createdDate: {type:Date, default:Date.now}
});

module.exports = mongoose.model('GroupCollection',groupCollection)

