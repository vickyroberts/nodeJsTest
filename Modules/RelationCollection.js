var mongoose = require("mongoose");
//Schema for storing user secrets
var relationSchema = mongoose.Schema;

//Create the User tree collections and save the relationship for the tree.
var relations = new relationSchema({
	hooksForUserId: {type: String, required:true, unique:true, index:true},
	trees:[{treeName:String, relations:[{userId: String, treeLevel:Number, relation:String, color:String, approved: {type:Boolean, required:true}}],status:{type:Boolean, default:true}}],	
	createdDate: {type:Date, default:Date.now}
});
module.exports = mongoose.model('RelationsHook',relations,'RelationCollection');