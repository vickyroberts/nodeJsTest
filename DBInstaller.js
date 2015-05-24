var mongoose = require("mongoose");
var userSecurity = require("./UserCollection.js");
var userDetails = require("./UserDetailsCollection.js");
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
	mongoose.connect(mongoUri, options);
	//console.log("line 51");
	CreateCollectionsAndRecord(true, pUserId, pUserName, pPassword, pFirstName, pLastName, pIsSuperUser);
}
catch(err)
{
	logger.debug(err);
}

//Start creating records for default user
function CreateCollectionsAndRecord(addDefaultUser, pUserId, pUserName, pPassword, pFirstName, pLastName, pIsSuperUser)
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
						CreateUserDetails(pUserId, pUserName, pPassword, pFirstName, pLastName, pIsSuperUser);						
					}
			});
	}	
}

//Create the User collection that will save the user details and default user.	
function CreateUserDetails(pUserId, pUserName, pPassword, pFirstName, pLastName, pIsSuperUser)
{
	//Object of Use module.
	var userInfo = new userDetails();
		
	userInfo.userId = pUserId;	
	userInfo.userName = pUserName;
	userInfo.firstName = pFirstName;
	userInfo.lastName = pLastName;	
	userInfo.address = {addressLine:"Lullanagar", city:"Pune", state:"Maharashtra",country:"India",isCurrentAddress:true};
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

