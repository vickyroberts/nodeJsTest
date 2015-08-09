var mongoose = require("mongoose");
//Schema for storing user chat
var chatSchema = mongoose.Schema;

//Create the collection that will save the chats.
var chatCollect = new chatSchema({	
	authorId: {type: String, required:true, index:true},	
	chatDetails: [{chatId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true}, 
		chatWithUserId:String,chat:[{dateTime:{type:Date, default:Date.now},message:String,file:{fileId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		fileName:String,filePath:String,fileType:String}}], status:Boolean}]	
	});
module.exports = mongoose.model('ChatCollection',chatCollect, 'ChatCollection');