var mongoose = require("mongoose");
//Schema for storing user jobs
var floatInviteSchema = mongoose.Schema;

//Create the Floats message collection that will save the jobs.
var inviteCollect = new floatInviteSchema({
	floatId: {type: Number, required:true, unique:true, index:true},	
	floatType: {type: String, required:true, index:true, default:"job"},
	authorId: {type: String, required:true, index:true},
	title: {type: String, required:true, index:true},
	description: String,
	invitation:{date:Date,venue:String,picture:{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		fileName:String,filePath:String,fileType:String}, backgroundPicture:{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		fileName:String,filePath:String,fileType:String}, aknowledgement:[{userId:String, available:Boolean}]},	
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
module.exports = mongoose.model('FloatsInvitationCollection',inviteCollect, 'FloatsInvitationCollection');