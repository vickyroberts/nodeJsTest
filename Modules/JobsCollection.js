var mongoose = require("mongoose");
//Schema for storing user jobs
var floatJobsSchema = mongoose.Schema;

//Create the Floats message collection that will save the jobs.
var jobsCollect = new floatJobsSchema({
	floatId: {type: mongoose.Schema.Types.ObjectId, required:true, unique:true},	
	floatType: {type: String, required:true, index:true, default:"job"},
	authorId: {type: String, required:true, index:true},
	name: {type: String, required:true, index:true},
	description: String,
	jobProfile:{qualification:[String],skills:[String],
		preferredLocation:[String],experienceYears:Number,
		documents:[{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
			fileName:String,filePath:String,fileType:String}],hideFromCompany:[String]},	
	isPublic:Boolean,
	totalViewsCount:Number,viewedUserIds:[Number],
	totalWowsCount:Number,wowsUserIds:[Number],
	sharedWithUserId:[String],
	sharedWithGroupId:[String],
	comments:[{commentId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
	commentBody:String,date:{type:Date, default:Date.now},authorId:String,
	commentPicture:{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		fileName:String,filePath:String,fileType:String,fileUploadedDate:{type:Date, default:Date.now}},
		totalWowsCount:Number,wowsUserIds:[Number]}],
	status:{type:Boolean, default:true},
	createdDate: {type:Date, default:Date.now}
});
module.exports = mongoose.model('FloatsJobsCollection',jobsCollect, 'FloatsJobsCollection');