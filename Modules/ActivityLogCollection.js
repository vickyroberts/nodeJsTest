var mongoose = require("mongoose");
//Schema for storing user secrets
var activitySchema = mongoose.Schema;

//Create the activity collection that will save the user activities.
//This detail will also be used to send email notification.	
var activityCollection = new activitySchema({
	activityId: {type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
	activityTypeName: String,	
	userId: String,
	onFloatId:String,	
	description: String,
	sendNotification:Boolean,
	notificationPriority: Number,		
	notificationTo:[String],	
	processCompleted: String,
	createdDate: {type:Date, default:Date.now}
});

module.exports = mongoose.model('ActivityLogCollection',activityCollection, 'ActivityLogCollection');

