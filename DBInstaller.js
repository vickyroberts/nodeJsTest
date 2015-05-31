var mongoose = require("mongoose");
var userSecurity = require("./Modules/UserSecurityCollection.js");
var userDetails = require("./Modules/UserDetailsCollection.js");
var relationDetails = require("./Modules/RelationCollection.js");
var floatDetails = require("./Modules/FloatsCollection.js");
var logger = require("./logger");
//mongo db connection url
var mongoUri = 'mongodb://localhost:27017/famhook';
//mongo db connection options
var options = {
  db: { native_parser: true },
  server: { poolSize: 5 },
  user: "admin",
  pass: "admin"
};

try{	
	var pUserId = 1;
	var pUserName = "fambook21@gmail.com";
	var pFirstName = "Fam";
	var pLastName = "Hook";
	var pPassword = "p@ssw0rd";	
	var pIsSuperUser = false;
	var globalUserId, globalFatherId;
	//console.log("line 22");
	//Read the arguments and set the user values. If arg is blank then set default user values set above.
	process.argv.forEach(function (val, index, array) 
	{ 
	  if(index > 1)
	  {
		  var argValue = val.split("=");
		  switch(argValue[0].toLowerCase())
		  {
			  case "username":
				pUserName = argValue[1];
				break;
			  case "password":
				pPassword = argValue[1];
				break;
			  case "fname":
				pFirstName = argValue[1];
				break;
			  case "lname":
				pLastName = argValue[1];
				break;		
			  case "superuser":
				pIsSuperUser = argValue[1];
				break;
  		 }
	  }	  
	});
	//console.log("line 48");
	//connect mongo db using mongoose
	mongoose.connect(mongoUri, options, function(err){
		
		if(err)
		{
			console.log("Error while mongo connection" + err);
			logger.debug("Error while connecting to mongo" + err);
		}
		else
		{
			//Add Superuser
			CreateCollectionsAndRecord(true, pUserId, pUserName, pPassword, pFirstName, pLastName, pIsSuperUser, 1);
			
			setTimeout(function() {		
				var levelOneUser = globalUserId;	
				//Add relation i.e. Father
				var pUserId = 2;
				var pUserName = "vicky.roberts@gmail.com";
				var pFirstName = "Father";
				var pLastName = "Hook";
				var pPassword = "p@ssw0rd";	
				var pIsSuperUser = false;
				
				CreateCollectionsAndRecord(true, 2, pUserName, pPassword, pFirstName, pLastName, pIsSuperUser, 2);
				var levelTwoUser = globalUserId;
				//Create relationship record for both above users
				CreateRelation(levelOneUser, levelTwoUser);
				//Save float details
				CreateFloatRecords(pUserId, levelTwoUser, pFirstName, pLastName, pIsSuperUser);	
				
			}, 2000);	
		}
		
	});
	
}
catch(err)
{
	logger.debug(err);
}

//Start creating records for default user
function CreateCollectionsAndRecord(addDefaultUser, pUserId, pUserName, pPassword, pFirstName, pLastName, pIsSuperUser, pProfFileId)
{
	//User security values.
	var secreateInfo = new userSecurity();	
	if(addDefaultUser)
	{
			console.log("line 66");
			var date = new Date();
			var appendToExternalId = date.getDate()+""+date.getMonth()+""+date.getFullYear();
			secreateInfo.userId = pUserId;
			secreateInfo.extId = appendToExternalId + "" +secreateInfo.userId;
			globalUserId = 	secreateInfo.extId;					
			//Date is not passed as default date.now will be set for password object.
			secreateInfo.passwords = {password:pPassword};
			//console.log("line 73");
			secreateInfo.save(function(err)
			{
					//console.log("line 76");
					if(err)
					{
						console.log("Error while saving" + err);
						logger.debug("Error while saving the record for superuser" + err);
					}
					else
					{
						logger.debug("Secret record saved successfully");
						console.log("Secret record saved successfully");
						//console.log("line 84");																	
						CreateUserDetails(pUserId, pUserName, pPassword, pFirstName, pLastName, pIsSuperUser, pProfFileId);						
					}
			});
	}	
}

//Create the User collection that will save the user details and default user.	
function CreateUserDetails(pUserId, pUserName, pPassword, pFirstName, pLastName, pIsSuperUser, pProfFileId)
{
	//Object of Use module.
	var userInfo = new userDetails();
		
	userInfo.userId = pUserId;	
	userInfo.userName = pUserName;
	userInfo.firstName = pFirstName;
	userInfo.lastName = pLastName;	
	userInfo.address = {addressLine:"Lullanagar", city:"Pune", state:"Maharashtra",country:"India",isCurrentAddress:true};	
	var profFileName = pProfFileId + pUserId + ".jpeg"; 
	var proffilePath = "H:/Famhook/" + profFileName;
	userInfo.profilePicture = {fileId:pProfFileId,fileName:profFileName,filePath:proffilePath,fileType:"jpeg"};
	userInfo.albums = [{albumName:"My Pics" + pUserId,isPublic:true,privateaccessUserIds:pUserId,
		   pictures:[{fileId:(pProfFileId+1),fileName:profFileName,filePath:"H:/Famhook/" + profFileName,fileType:"jpeg"}],
		   comments:[{pictureCommentId:(pProfFileId+1),description:"Very Good",authorId:pUserId}],
		   wows:{wowsCount:2,wowsUserId:[pUserId]}}];
	userInfo.accountType = "Personal";
	userInfo.education = {highestDegree:"MCA",collegeName:"JaiHind",location:"Pimpri, Pune"};
	userInfo.userTagValues = {qualification:["MCA", "BCA", "Diploma]"],profession:"IT",skills:[".Net","Mongo"],jobLocationPref:["Pune","Mumbai"],matriExpectedQualification:["BE","Accounts","LLB"],matriExpectedJob:["Lawyer","Engineer"],matriExpectedPreferedLocation:["Pune","Mumbai"]};
	userInfo.groupsTaggedTo = 1;
	userInfo.isSuperUser = pIsSuperUser;
	userInfo.status = true;
	userInfo.save(function(err)
	{
			if(err)
			{
				console.log("Error while saving" + err);
				logger.debug("Error while saving user details" + err);
			}
			else
			{
				logger.debug("User Details saved successfully");									
				console.log("User record saved successfully");	
				
			}
	});	
}

//Create Relationship tree for 2 users i.e. superuser and dummy user.
function CreateFloatRecords(forUserId, toUserId, pFirstName, pLastName, pIsSuperUser)
{
	//Object of Use module.
	var floatCollection = new floatDetails();	
	
	floatCollection.floatId= 1;
	floatCollection.floatType= "Message";
	floatCollection.authorId= forUserId;
	floatCollection.title = "My First Message";
	floatCollection.description = "My First message description";
	var profFileId = 1;
	var profFileName = profFileId + pUserId + ".jpeg"; 
	var proffilePath = "H:/Famhook/" + profFileName;
	floatCollection.messageFiles = [{fileId:profFileId,fileName:profFileName,filePath:proffilePath,fileType:"jpeg"}];
	floatCollection.newsReferences = ["http://economictimes.com","http://ndtv.com"];
	floatCollection.vote = {voteDescription:"Need to go for a trip",options:[{title:"Lonavala",pictures:{fileId:1,fileName:"Lonavala.jpeg",filePath:"H:/Famhook/Vote/Lonavala.jpeg",fileType:"jpeg"},votesUserIds:[toUserId]}]};
	var inviteDate = new Date();
	floatCollection.invitation = {date:inviteDate,venue:"Pune, Kondwa",
	pictures:[{fileId:1,fileName:"Birthday.jpeg",filePath:"H:/Famhook/Invite/Birthday.jpeg",fileType:"jpeg"}],
	acknowledgeBy:[{userId:toUserId,available:true}]};
	floatCollection.jobProfile = {qualification:["Engineer"],skills:[".Net","SQL"] ,preferredLocation:["Pune","Mumbai"],
	experienceYears:10,documents:[{fileId:2,fileName:forUserId +"-Resume.doc",filePath:"H:/Famhook/JobProfile/"+forUserId +"-Resume.doc",fileType:"doc"}],hideFromCompany:["TechM","TechMahindra"]};
	floatCollection.matrimonial = {qualification:["Engineer"],job:["IT Engineer"],location:"Pune",
	religion:"Hindu",caste:"Maratha",expectedQualification:["Engineer","Lawyer","Teacher"],
	expectedJob:["IT Engineer","Self Employeed", "Teacher"],expectedFromCity:["Pune","Mumbai","Nagpur"], 
	documents:[{fileId:3,fileName:forUserId +"-matrimonialProfile.doc",filePath:"H:/Famhook/MatrimonialProfile/"+forUserId +"-matrimonialProfile.doc",fileType:"doc"},
	{fileId:4,fileName:forUserId +"-matrimonialPicture1.jpeg",filePath:"H:/Famhook/MatrimonialPictures/"+forUserId +"-matrimonialPicture1.jpeg",fileType:"jpeg"}]};
	floatCollection.isPublic = false;
	floatCollection.totalViews = {totalCount:10,viewedUserIds:[toUserId]};
	floatCollection.wows = {totalCount:5,byUserIds:[toUserId]};
	floatCollection.sharedWithUserId = [toUserId];
	floatCollection.sharedWithGroupId = [1];
	floatCollection.comments = [{commentId:1,description:"Great Pic",authorId:toUserId}];
	floatCollection.save(function(err)
	{
			if(err)
			{
				console.log("Error while saving" + err);
				logger.debug("Error while saving float details" + err);
			}
			else
			{
				logger.debug("Float saved successfully");									
				console.log("Float saved successfully");	
				
			}
	});	
}

//Create Relationship tree for 2 users i.e. superuser and dummy user.
function CreateRelation(forUserId, withUserId)
{
	//Object of Use module.
	var relationInfo = new relationDetails();
	
	relationInfo.hooksForUserId = forUserId;	
	relationInfo.family = [{userId:forUserId,archivedUserId:0,treeLevel:2,relation:"Self",color:"Green"},{userId:withUserId,archivedUserId:0,treeLevel:1,relation:"Father",color:"Green"}];	
	relationInfo.friends = [{userId:withUserId,archivedUserId:0,treeLevel:1,relation:"Close Friend",color:"Green"}];
	relationInfo.organization = [{userId:withUserId,archivedUserId:0,treeLevel:1,relation:"CEO",color:"Green"}];	
	relationInfo.save(function(err)
	{
			if(err)
			{
				console.log("Error while saving" + err);
				logger.debug("Error while saving user relations" + err);
			}
			else
			{
				logger.debug("User Relation saved successfully");									
				console.log("User relation saved successfully");	
				
			}
	});	
}

