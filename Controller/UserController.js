//Default packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var promise = require("bluebird");
//Custom packages
var userSecurity = require("../Modules/UserSecurityCollection.js");
var userDetails = require("../Modules/UserDetailsCollection.js");
var logger = require("../logger");
var conn = require("./Connection.js");

promise.promisifyAll(mongoose);
promise.promisifyAll(bcrypt);

exports.getUsersList= function(req, res) {
    
    userDetails.find({userId:req.user.userId},function(err,user) {
        if(err)
        {
            res.send(err);
        }
        else
        {
            res.json(user);
        }        
    });    
};

// Check if the user is logged in and return the message.
exports.postUserLogin = function(req, res) {  
  // Set the client properties that came from the POST data
  if(req.body && req.body.username && req.body.password)
  {
    var userName = req.body.username;
    var password = req.body.password;
    logger.debug("UserControl - Searching for login post");
     userSecurity.findOne({ userName: userName }).then(function (user) {
        
          console.log("Username found");
          // No user found with that username
          if (!user) 
          { 
            console.log("Username not found");
            logger.debug("UserControl login : Username not found = " + userName);
            res.json({message:"Username not found"});        
          }
    
          // Make sure the password is correct
          user.verifyPassword(password, function(err, isMatch) {
            if (err) 
            { 
              console.log("Password not found" + err);
              logger.debug("UserControl login : Password not found");
              res.json({message:"Error : Password not found"});
              //return callback(err);
            }else
            {
              console.log("Password found");          
            }
    
            // Password did not match
            if (!isMatch) 
            { 
              logger.debug("UserControl login : Password not found");
              res.json({message:"Error : Password not found"}); 
            }
    
            res.json({message:"Login Successful"});
          });
        }).catch(function(err)
        {
           console.log("Username not found" + err);
            logger.debug("UserControl login : Username not found = " + userName);
            res.json({message:"Error : Username not found"});  
        });
      }
      else
      {
        logger.debug("UserControl login : UserName or Password not found");
        res.json({message:"Error : UserName or Password not found"}); 
      }
  };

// Check if the user is logged in and return the message.
exports.postUserRegister = function(req, res) {  
  // Set the client properties that came from the POST data
  if(req.body && req.body.username && req.body.password)
  {
      var userName = req.body.username;
      var password = req.body.password;
      var fName = req.body.firstname;
      var lName = req.body.lastName;
      var gender = req.body.gender;
      
      if(userName == null || userName == "" || !ValidateEmail(userName))
      {         
         logger.debug("UserControl register : Username is invalid = " + userName);
         res.json({message:"Error : Username "+userName+" is invalid"});   
         res.end();
      }
      else if(password == null || password == "" || !ValidatePassword(password))
      {
        // at least one number, one lowercase and one uppercase letter
        // at least six characters  
        logger.debug("UserControl register : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase");
         res.json({message:"Error : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase"});
         res.end();   
      }
      else if(fName == null || fName == "" || lName == null || lName == "")
      {
        logger.debug("UserControl register : FirstName or LastName cannot be blank");
         res.json({message:"Error : FirstName or LastName cannot be blank"});
         res.end();   
      }
      else
      {      
        logger.debug("UserControl register :  Search and save registration.");
        CreateCollectionsAndRecord(res, userName, password, fName, lName, gender);
      } 
    }
};

//Create record for user - security and details
function CreateCollectionsAndRecord(res, pUserName, pPassword, pFirstName, pLastName, pGender)
{
	//User security values.
	  var secreateInfo = new userSecurity();
    var userInfo = new userDetails();	
		var date = new Date();
		var appendToExternalId = date.getDate()+"v"+date.getMonth()+"r"+date.getFullYear();
    
    //Using promise first find record with username. If record is not found add user secret and details.
    userSecurity.findOne({ userName: pUserName }).then(function (user) 
       {
          if (user) 
          { 
            console.log("Username already exists");
            logger.debug("UserControl register : Username already exists = " + pUserName);
            res.json({message:"Error : Username already exists"});         
          }
          else
          { 
            //Hash the password value.
            bcrypt.genSaltAsync(5).then(function(salt) 
             {        	       
               bcrypt.hashAsync(pPassword, salt, null).then(function(hash) 
          	    {
          		      return hash;
               }).then(function(retHashPwd)
               {
                  logger.debug("Hashed created");          
                  //SAVE UserSecret Code Starts
                  logger.debug("SAVE UserSecret Code Starts");   
                  secreateInfo.userId = mongoose.Types.ObjectId();
              		secreateInfo.extId = appendToExternalId+ "" +secreateInfo.userId;              		    
              		secreateInfo.password = retHashPwd;	
              		secreateInfo.userName = pUserName;
              		secreateInfo.passwords = {password:retHashPwd};
                  secreateInfo.status = false;              		
              		return secreateInfo.saveAsync()}).then(function(userSaved)
              		{    
                        logger.debug("CreateCollectionsAndRecord : Success : Secret record saved successfully");
              					console.log("Success : Secret record saved successfully");                       
                        
                        if(userSaved.length > 0)	
                      	   {userInfo.userId = userSaved[0].userId;}
                        else
                            {userInfo.userId = secreateInfo.userId;}
                      	userInfo.firstName = pFirstName;
                      	userInfo.lastName = pLastName;
                        userInfo.gender = 	pGender;              		
                      	var profFileName = "DefaultUser.jpeg"; 
                      	var proffilePath = "./DefaultPictures/" + profFileName; 
                        userInfo.profilePicture = {fileId:mongoose.Types.ObjectId(),fileName:profFileName,filePath:proffilePath,fileType:"JPEG"};             	
                      	userInfo.accountType = "Personal";              	
                      	return userInfo.saveAsync()}).then(function(userDetailsSaved)
                        {
                            logger.debug("CreateCollectionsAndRecord : User Details saved successfully");									
                    				console.log("User record saved successfully");
                            var updateUserId = userInfo.userId;
                             
                            if(userDetailsSaved.length > 0)
                              updateUserId = userDetailsSaved[0].userId;
                            //Update user status to active start
                            secreateInfo = new userSecurity();
                            secreateInfo.updateAsync({userId:updateUserId},{status:true},{ multi: false },{customIdCondition: true}).then(function(updateStatus){
                                logger.debug("CreateCollectionsAndRecord : User Details added successfully and activates " + updateStatus);                                
                                res.json({message:"Userdetails saved successfully..!!"});
                            });
                        }).catch(function(err)
                          {
                            console.log("Error while saving" + err);
                      			logger.debug("CreateCollectionsAndRecord : Error : while saving the user details" + err);
                            res.json({message:"Error : while saving the user details"});                    
                          });
             }).catch(function(err)
               {
                 console.log("GenSalth hashed password error " + err);
                 logger.debug("CreateCollectionsAndRecord : hash function failed" + err);
                 res.json({message:"Error : Hash function failed"});                 
               });
          }
       }).catch(function(err)
       {
            console.log("Username already exists");
            logger.debug("UserControl register : Username already exists = " + pUserName);
            res.json({message:"Error : Username already exists"});
       });;                           
}

//Validate Password
function ValidatePassword(password)
{
  // at least one number, one lowercase and one uppercase letter
  // at least six characters
  var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,10}$/;
  return re.test(password);
}

//Validate email
function ValidateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

//This function creates a hash of input values required for Bcrypt.
function HashKeywords(input)
{		
	//Password changed so we need to hash it  
	  bcrypt.genSalt(5, function(err, salt) 
     {
	       if (err) 
         {
           Console.log("error while creating hash for "+ input);
         };
	
	       hashedVal = bcrypt.hash(input, salt, null, function(err, hash) 
    	    {
        	    if (err)
        	    { return "";}
    	    
    	        var hashedValue = hash;
    		      return hashedValue;
	       });
	   });
}