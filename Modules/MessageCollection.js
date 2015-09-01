var mongoose = require("mongoose");
//Schema for storing user messages
var floatMessageSchema = mongoose.Schema;

//Create the Floats message collection that will save the messages.
var messageCollect = new floatMessageSchema({
	floatId: {type: mongoose.Schema.Types.ObjectId, required:true, unique:true},	
	floatType: {type: String, required:true, index:true, default:"message"},
	authorId: {type: String, required:true, index:true},
	title: {type: String, required:true, index:true},
	description: String,
	messageFiles: [{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		fileName:String,filePath:String,fileType:String}],
	location:String,locationUrl:String,		
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
module.exports = mongoose.model('FloatsMessageCollection',messageCollect, 'FloatsMessageCollection');