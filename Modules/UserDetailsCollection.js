var mongoose = require("mongoose");
//Schema for storing user secrets
var userSchema = mongoose.Schema;

//Create the User collection that will save the user details.
//This function will also add a default superuser entry.	
var userDetailsSchema = new userSchema({
	userId: {type: Number, required:true, unique:true, index:true},	
	userName: {type: String, required:true, unique:true, index:true},
	firstName: {type: String, required:true, index:true},
	lastName: {type: String, required:true, index:true},
	address: [{addressLine:String,city:String,state:String,country:String,isCurrentAddress:Boolean}],
	profilePicture:{fileId:{type: Number, required:true, unique:true},fileName:String,filePath:String,fileType:String},
	albums:[{albumName:String,isPublic:{type:Boolean, default:true},privateaccessUserIds:[Number],
		   pictures:[{fileId:{type: Number, required:true, unique:true},fileName:String,fileDescription:String,filePath:String,fileType:String}],
		   comments:[{pictureCommentId:{type: Number, required:true, unique:true},description:String,date:{type:Date, default:Date.now},authorId:Number}],
		   wows:{wowsCount:Number,wowsUserId:[Number]}}],
	accountType: String,
	education: [{highestDegree:String,collegeName:String,location:String}],
	userTagValues:{qualification:[String],profession:String,skills:[String],jobLocationPref:[String],matriExpectedQualification:[String],matriExpectedJob:[String],matriExpectedPreferedLocation:[String]},
	groupsTaggedTo:[Number],
	isSuperUser:Boolean,
	status:{type:Boolean, default:true},
	createdDate: {type:Date, default:Date.now}
});
module.exports = mongoose.model('UserDetails',userDetailsSchema,'UserDetailsCollection');