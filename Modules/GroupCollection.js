var mongoose = require("mongoose");
//Schema for storing user secrets
var groupSchema = mongoose.Schema;

//Create the usersecurity collection that will save the user credential details.
//This function will also add a default superuser entry.	
var groupCollection = new groupSchema({
	groupId: {type:Number, index:true},
	groupName: {type:String, index:true},
	groupType: String,
	description: String,
	pictures:[{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		fileName:String,filePath:String,fileType:String,fileUploadedDate:{type:Date, default:Date.now}}],
	userIds: [String],	
	displayAdminDetails:{type:Boolean, default:true},
	status: Boolean,
	createdDate: {type:Date, default:Date.now}
});

module.exports = mongoose.model('GroupCollection',groupCollection,'GroupCollection');

