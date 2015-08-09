var mongoose = require("mongoose");
//Schema for storing user votes
var floatVotesSchema = mongoose.Schema;

//Create the Floats message collection that will save the votes.
var votesCollect = new floatVotesSchema({
	floatId: {type: Number, required:true, unique:true, index:true},	
	floatType: {type: String, required:true, index:true, default:"job"},
	authorId: {type: String, required:true, index:true},
	question: {type: String, required:true, index:true},
	description: String,
	vote: {options:[{title:String,pictures:{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		fileName:String,filePath:String,fileType:String},
		votesUserIds:[Number]}]},	
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
module.exports = mongoose.model('FloatsVotesCollection',votesCollect, 'FloatsVotesCollection');