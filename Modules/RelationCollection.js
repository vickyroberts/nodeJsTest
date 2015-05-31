var mongoose = require("mongoose");
//Schema for storing user secrets
var relationSchema = mongoose.Schema;

//Create the User collection that will save the user details.
//This function will also add a default superuser entry.	
var relations = new relationSchema({
	hooksForUserId: {type: Number, required:true, unique:true, index:true},	
	family: [{userId:Number,archivedUserId:Number,treeLevel:Number,relation:String,color:String}],
	friends: [{userId:Number,treeLevel:Number,relation:String,color:String}],
	organization: [{userId:Number,treeLevel:Number,relation:String,color:String}],	
	status:{type:Boolean, default:true},
	createdDate: {type:Date, default:Date.now}
});
module.exports = mongoose.model('RelationsHook',relations,'RelationCollection');