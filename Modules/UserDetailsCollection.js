var mongoose = require("mongoose");
//Schema for storing user secrets
var userSchema = mongoose.Schema;

//Create the User collection that will save the user details.
//This function will also add a default superuser entry.	
var userDetailsSchema = new userSchema({
	userId: {type: mongoose.Schema.Types.ObjectId, required:true, unique:true},	
	firstName: {type: String, required:true, index:true},
	lastName: {type: String, required:true, index:true},
	gender: Boolean,
	address: [{addressLine:String,city:String,state:String,country:String,isCurrentAddress:Boolean}],
	profilePicture:{fileId:{type: mongoose.Schema.Types.ObjectId, unique:true},fileName:String,filePath:String,fileType:String},
	albums:[{albumName:String,isPublic:{type:Boolean, default:true},privateaccessUserIds:[Number],
		   pictures:[{fileId:mongoose.Schema.Types.ObjectId,fileName:String,fileDescription:String,filePath:String,fileType:String}],
		   comments:[{pictureCommentId:mongoose.Schema.Types.ObjectId,description:String,date:{type:Date, default:Date.now},authorId:Number}],
		   wows:{wowsCount:Number,wowsUserId:[Number]}}],
	accountType: String,
	education: [{highestDegree:String,collegeName:String,location:String}],
	userTagValues:{qualification:[String],profession:String,skills:[String],jobLocationPref:[String],matriExpectedQualification:[String],matriExpectedJob:[String],matriExpectedPreferedLocation:[String]},
	groupsTaggedTo:[Number],
	isSuperUser:{type:Boolean, default:false},
	viewJobsOpp:{type:Boolean, default:false},
	viewMatrimonialOpp:{type:Boolean, default:false},	
	createdDate: {type:Date, default:Date.now}
});
module.exports = mongoose.model('UserDetails',userDetailsSchema,'UserDetailsCollection');