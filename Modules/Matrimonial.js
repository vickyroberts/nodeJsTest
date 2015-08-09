var mongoose = require("mongoose");
//Schema for storing user matrimonial
var floatMatrimonialSchema = mongoose.Schema;

//Create the Floats message collection that will save the matrimonial.
var matriCollect = new floatMatrimonialSchema({
	floatId: {type: Number, required:true, unique:true, index:true},	
	floatType: {type: String, required:true, index:true, default:"matrimonial"},
	authorId: {type: String, required:true, index:true},
	name: {type: String, required:true, index:true},
	description: String,
	matrimonial:{qualification:[String],jobTitle:[String],
		location:String,religion:String,caste:String,
		expectedQualification:[String],expectedJob:[String],expectedFromCity:[String],
		expectedSameReligion:Boolean,expectedSameCaste:Boolean, 
		documents:[{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		fileName:String,filePath:String,fileType:String,fileUploadedDate:{type:Date, default:Date.now}}]},	
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
module.exports = mongoose.model('FloatsMatrimonialCollection',matriCollect, 'FloatsMatrimonialCollection');