var mongoose = require("mongoose");
//Schema for storing user secrets
var activitySchema = mongoose.Schema;

//Create the usersecurity collection that will save the user credential details.
//This function will also add a default superuser entry.	
var activityCollection = new activitySchema({
	logId: Number,
	activityType: String,	
	byUserId: Number,
	onFloatId: Number,
	description: String,
	elapsedTimeSeconds: Number,	
	sendNotificationToUserId:[Number],	
	activityStatus: String,
	createdDate: {type:Date, default:Date.now}
});

module.exports = mongoose.model('ActivityLogCollection',activityCollection, 'ActivityLogCollection')

