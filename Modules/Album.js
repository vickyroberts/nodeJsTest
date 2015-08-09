var mongoose = require("mongoose");
//Schema for storing user secrets
var albumSchema = mongoose.Schema;

//Create the usersecurity collection that will save the user credential details.
//This function will also add a default superuser entry.	
var albumcollection = new albumSchema({
	albumForUId: {type:String, index:true},
	albumList:[{albumId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
		albumName:String, access:String, sharedWithUserId: [Number], description:String, albumCreatedDate:{type:Date, default:Date.now},pictures:[{fileName:String, filePath:String, 
			fileDescription:String,fileUploadedDate:{type:Date, default:Date.now},totalViews:Number,viewUserId:[Number],wows:Number,wowsUserId:[Number],
			comments: [{commentId:{type: mongoose.Schema.Types.ObjectId, required:true, unique:true},
				commentBody:String, date:{type:Date, default:Date.now},authorId:String, commentpicture:{filename:String, 
					filepath:String, fileuploadeddate: {type:Date, default:Date.now}}}]}]}],			
	albumCreatedDate: {type:Date, default:Date.now}
});

module.exports = mongoose.model('AlbumCollection',albumcollection,'AlbumCollection');