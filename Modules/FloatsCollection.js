var mongoose = require("mongoose");
//Schema for storing user secrets
var floatsSchema = mongoose.Schema;

//Create the Floats collection that will save the floats (i.e. messages, invitations, job/matrimonial profiles etc.).
//This function will also add a default entry.	
var floatsCollect = new floatsSchema({
	floatId: {type: Number, required:true, unique:true, index:true},	
	floatType: {type: String, required:true, index:true},
	authorId: {type: Number, required:true, index:true},
	title: {type: String, required:true, index:true},
	description: String,
	messageFiles: [{fileId:{type: Number, required:true, unique:true},fileName:String,filePath:String,fileType:String}],
	newsReferences: [String],
	vote: {options:[{title:String,pictures:{fileId:{type: Number, required:true, unique:true},fileName:String,filePath:String,fileType:String},votesUserIds:[Number]}]},
	invitation:{date:Date,venue:String,pictures:[{fileId:{type: Number, required:true, unique:true},fileName:String,filePath:String,fileType:String}],acknowledgeBy:[{userId:Number,available:Boolean}]},
	jobProfile:{qualification:[String],skills:[String],preferredLocation:[String],experienceYears:Number,documents:[{fileId:{type: Number, required:true, unique:true},fileName:String,filePath:String,fileType:String}],hideFromCompany:[String]},
	matrimonial:{qualification:[String],job:[String],location:String,religion:String,caste:String,expectedQualification:[String],expectedJob:[String],expectedFromCity:[String], documents:[{fileId:{type: Number, required:true, unique:true},fileName:String,filePath:String,fileType:String}]},	
	isPublic:Boolean,
	totalViews:{totalCount:Number,viewedUserIds:[Number]},wows:{totalCount:Number,byUserIds:[Number]},
	sharedWithUserId:[Number],
	sharedWithGroupId:[Number],
	comments:[{commentId:{type: Number, required:true, unique:true},description:String,date:{type:Date, default:Date.now},authorId:Number}],
	status:{type:Boolean, default:true},
	createdDate: {type:Date, default:Date.now}
});
module.exports = mongoose.model('FloatsCollection',floatsCollect, 'FloatsCollection');