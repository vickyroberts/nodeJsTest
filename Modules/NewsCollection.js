var mongoose = require("mongoose");
//Schema for storing user news
var floatNewsSchema = mongoose.Schema;

//Create the Floats news collection that will save the news.
var newsCollect = new floatNewsSchema({
	floatId: {type: Number, required:true, unique:true, index:true},	
	floatType: {type: String, required:true, index:true, default:"news"},
	authorId: {type: String, required:true, index:true},
	title: {type: String, required:true, index:true},
	description: String,
	newsfile: [{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		fileName:String,filePath:String,fileType:String}],
	newsReferenceUrl:String,		
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
module.exports = mongoose.model('FloatsNewsCollection',newsCollect, 'FloatsNewsCollection');