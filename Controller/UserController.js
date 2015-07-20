//Default packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var promise = require("bluebird");
var pg = require('pg');
//Custom packages
var userSecurity = require("../Modules/UserSecurityCollection.js");
var userDetails = require("../Modules/UserDetailsCollection.js");
var logger = require("../logger");
var conn = require("./Connection.js");

promise.promisifyAll(mongoose);
promise.promisifyAll(bcrypt);
promise.promisifyAll(pg);

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
    
   var pschemaName = conn.getDBSchema(userName);     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("postUserLogin - Error while connection PG" + err);
        logger.debug("postUserLogin - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbusersecurity WHERE username = $1", [userName]).then(function(result)
         {
            var passwordList = "";
            var passObj = null;
           if(result && result.rows && result.rows.length > 0)
           {
             // Make sure the password is correct
                bcrypt.compareAsync(password, result.rows[0].password).then(function(isMatch)
                {            
                    if(!isMatch)
                    {
                      res.json({message:"Error : Username or password not found"}); 
                    }
                    else
                    {
                      res.json({message:"Success : Login successfull"}); 
                    }
                });
           }
           else
           {
             console.log("Username or password not found");
            logger.debug("UserControl login : Username or password not found = " + userName);
            res.json({message:"Username or password not found"});  
           }
         }).catch(function(err)
          {
             console.log("Username or password not found" + err);
              logger.debug("UserControl login : Username or password not found = " + userName);
              res.json({message:"Error : Username or password not found"});  
          });
      }
    });
  }
}
    
    
    

// Check if the user is logged in and return the message.
exports.postUserRegister = function(req, res) {  
  // Set the client properties that came from the POST data
  if(req.body && req.body.username && req.body.password)
  {
      var userName = req.body.username;
      var password = req.body.password;
      var fName = req.body.firstname;
      var lName = req.body.lastname;
      var gender = 1;
      var accountType = req.body.accounttype;
      var countryId = req.body.countryid;
      var schemaName = conn.getDBSchema(userName);
      
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
        CreateCollectionsAndRecordPG(res, userName, password, fName, lName, gender, accountType, countryId, schemaName);
      } 
    }
};

// Check if the details are valid and change the password.
exports.changePasswordRegister = function(req, res) {
  
  if(req.body && req.body.username && req.body.password && req.body.newpassword)
  {
      var retUserName = req.body.username;
      var retPassword = req.body.password;
      var retNewPassword = req.body.newpassword;
           
      //Using promise first find record with username. If record is found update the password.
      userSecurity.findOne({ userName: retUserName}).then(function (user) {
        if(!user)
        {
          console.log("Username does not exists");
          logger.debug("UserControl changePasswordRegister : Username does not exists = " + retUserName);
          res.json({message:"Error : Username does not exists"});
          return null;    
        }
        else
        {          
            // Make sure the password is correct
            bcrypt.compareAsync(retPassword, user.password).then(function(isMatch)
            {            
                if(!isMatch)
                {
                  // at least one number, one lowercase and one uppercase letter
                  // at least six characters  
                  logger.debug("UserControl newPassword : Password is not valid");
                   res.json({message:"Error : Password is not valid"});
                   res.end();   
                }      
                else if(!ValidatePassword(retNewPassword))
                {
                  logger.debug("UserControl newPassword : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase");
                   res.json({message:"Error : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase"});
                   res.end();   
                }
                else
                {      
                  logger.debug("UserControl new password :  Update new password.");
                  var secreateInfo = new userSecurity();
                        bcrypt.genSaltAsync(5).then(function(salt) 
                        {        	       
                           bcrypt.hashAsync(retNewPassword, salt, null).then(function(hash) 
                      	    {
                      		      return hash;
                           }).then(function(retHashPwd)
                           {
                             var isLast5Password = false;
                             var pwdCount = 0;
                             //Check if password is from last 5 password list.
                             if(user.oldPasswords && user.oldPasswords.length > 0)
                             {
                                 for(var cnt=0;cnt<user.oldPasswords.length;cnt++)
                                 {
                                   if(pwdCount<5)
                                   {
                                      var previousPwd = user.oldPasswords[cnt].password;
                                      if(previousPwd == retHashPwd)
                                      {
                                        isLast5Password = true;
                                      }
                                      pwdCount++;
                                   }  
                                   else
                                      break;
                                 }
                             }
                             
                             if(isLast5Password)
                             {
                                  console.log("New password was set earlier. Password should not be from last 5 passwords");
                            			logger.debug("changePasswordRegister : Error : New password was set earlier. Password should not be from last 5 passwords");
                                  res.json({message:"Error : New password was set earlier. Password should not be from last 5 passwords"});  
                             }
                             else
                             {
                                secreateInfo.updateAsync({userId:user.userId},{$pushAll:{oldPasswords:[{password:retHashPwd}]},$set:{password:retHashPwd}},{ upsert: true },{customIdCondition: true}).then(function(updateStatus){
                                      logger.debug("CreateCollectionsAndRecord : Password updated successfully");                                
                                      res.json({message:"Password updated successfully..!!"});
                                  }).catch(function(err)
                                  {
                                    console.log("Error while updating password" + err);
                              			logger.debug("changePasswordRegister : Error : while updating the password" + err);
                                    res.json({message:"Error : while updating the password"});                    
                                  }); 
                             }
                           });
                        }).catch(function(err)
                         {
                              console.log("error in password hashing");
                              logger.debug("UserControl newPassword : Password is not valid");
                              res.json({message:"Error : Password is not valid"});
                         });                                   
                } 
            }).catch(function(err)
               {
                    console.log("Username or password is not valid");
                    logger.debug("UserControl newPassword : Username or password is not valid");
                    res.json({message:"Error : Username or password is not valid"});
               });   
        }
      }).catch(function(err)
       {
            console.log("Username does not exists");
            logger.debug("UserControl newPassword : Username does not exists " + retUserName);
            res.json({message:"Error : Username does not exists"});
       });    
  }
};

// Check if the details are valid and change the password.
exports.changePasswordRegisterPG = function(req, res) {
  
  if(req.body && req.body.username && req.body.password && req.body.newpassword)
  {
      var retUserName = req.body.username;
      var retPassword = req.body.password;
      var retNewPassword = req.body.newpassword;
      var pschemaName = conn.getDBSchema(retUserName);
     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("ClientSave - Error while connection PG" + err);
        logger.debug("ClientSave - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT userid from "+pschemaName+".tbusersecurity WHERE username = $1", [retUserName]).then(function(result)
         {
            var passwordList = "";
            var passObj = null;
           if(result && result.rows && result.rows.length > 0)
           {
             // Make sure the password is correct
                bcrypt.compareAsync(retPassword, result.rows[0].password).then(function(isMatch)
                {            
                    if(!isMatch)
                    {
                      // at least one number, one lowercase and one uppercase letter
                      // at least six characters  
                      logger.debug("UserControl newPassword : Password is not valid");
                       res.json({message:"Error : Password is not valid"});
                       res.end();   
                    }      
                    else if(!ValidatePassword(retNewPassword))
                    {
                      logger.debug("UserControl newPassword : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase");
                       res.json({message:"Error : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase"});
                       res.end();   
                    }
                    else
                    {      
                      logger.debug("UserControl new password :  Update new password.");                  
                      
                      bcrypt.genSaltAsync(5).then(function(salt) 
                      {        	       
                         bcrypt.hashAsync(retNewPassword, salt, null).then(function(hash) 
                    	    {
                    		      return hash;
                         }).then(function(retHashPwd)
                         {
                           var isLast5Password = false;
                           var pwdCount = 0;
                           //Check if password is from last 5 password list.
                           if(result && result.rows && result.rows.length > 0)
                           {
                               passwordList = result.rows[0].oldpasswords;
                               passObj = JSON.parse(passwordList);
                                
                               for(var cnt=0;cnt<passObj.passwords.length;cnt++)
                               {
                                 if(pwdCount<5)
                                 {
                                    var previousPwd = passObj.passwords[cnt];
                                    if(previousPwd == retHashPwd)
                                    {
                                      isLast5Password = true;
                                    }
                                    pwdCount++;
                                 }  
                                 else
                                    break;
                               }
                           }
                           
                           if(isLast5Password)
                           {
                                console.log("New password was set earlier. Password should not be from last 5 passwords");
                          			logger.debug("changePasswordRegister : Error : New password was set earlier. Password should not be from last 5 passwords");
                                res.json({message:"Error : New password was set earlier. Password should not be from last 5 passwords"});  
                           }
                           else
                           {
                             if(passObj != null)
                             {
                               var newpassObj = passObj.push(retHashPwd);
                                clientConn.queryAsync("UPDATE "+pschemaName+".tbusersecurity SET password=$1, oldpasswords=$2 WHERE userid = $3 RETURNING userid", [retHashPwd, JSON.stringify(newpassObj),result.rows[0].userid]).then(function(result){
                                  
                                    if(result && result.rows && result.rows.length>0)
                                    {
                                      logger.debug("CreateCollectionsAndRecord : Password updated successfully");                                
                                      res.json({message:"Password updated successfully..!!"});
                                    }
                                    else
                                    {
                                      console.log("Error while updating password");
                                			logger.debug("changePasswordRegister : Error : while updating the password");
                                      res.json({message:"Error : while updating the password"});  
                                    }
                                    clientConn.end();
                                }).catch(function(err)
                                {
                                   clientConn.end();
                                  console.log("Error while updating password" + err);
                            			logger.debug("changePasswordRegister : Error : while updating the password" + err);
                                  res.json({message:"Error : while updating the password"});                    
                                });  
                             }
                             else
                             {
                                  console.log("Error while updating password");
                            			logger.debug("changePasswordRegister : Error : while updating the password");
                                  res.json({message:"Error : while updating the password"});  
                             }
                              
                           }
                         });
                      });                 
                      
                    }
                }).catch(function(err)
                         {
                              console.log("error in password hashing");
                              logger.debug("UserControl newPassword : Password is not valid");
                              res.json({message:"Error : Password is not valid"});
                         });        
           }
           else
           {
              console.log("Username does not exists");
              logger.debug("UserControl changePasswordRegister : Username does not exists = " + retUserName);
              res.json({message:"Error : Username does not exists"});
              return null;
           }
         }).catch(function(err)
           {
                console.log("Username does not exists");
                logger.debug("UserControl newPassword : Username does not exists " + retUserName);
                res.json({message:"Error : Username does not exists"});
           });
      }
    });
         
       
      
      //Using promise first find record with username. If record is found update the password.
      userSecurity.findOne({ userName: retUserName}).then(function (user) {
        if(!user)
        {
          console.log("Username does not exists");
          logger.debug("UserControl changePasswordRegister : Username does not exists = " + retUserName);
          res.json({message:"Error : Username does not exists"});
          return null;    
        }
        else
        {          
            // Make sure the password is correct
            bcrypt.compareAsync(retPassword, user.password).then(function(isMatch)
            {            
                if(!isMatch)
                {
                  // at least one number, one lowercase and one uppercase letter
                  // at least six characters  
                  logger.debug("UserControl newPassword : Password is not valid");
                   res.json({message:"Error : Password is not valid"});
                   res.end();   
                }      
                else if(!ValidatePassword(retNewPassword))
                {
                  logger.debug("UserControl newPassword : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase");
                   res.json({message:"Error : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase"});
                   res.end();   
                }
                else
                {      
                  logger.debug("UserControl new password :  Update new password.");
                  var secreateInfo = new userSecurity();
                        bcrypt.genSaltAsync(5).then(function(salt) 
                        {        	       
                           bcrypt.hashAsync(retNewPassword, salt, null).then(function(hash) 
                      	    {
                      		      return hash;
                           }).then(function(retHashPwd)
                           {
                             var isLast5Password = false;
                             var pwdCount = 0;
                             //Check if password is from last 5 password list.
                             if(user.oldPasswords && user.oldPasswords.length > 0)
                             {
                                 for(var cnt=0;cnt<user.oldPasswords.length;cnt++)
                                 {
                                   if(pwdCount<5)
                                   {
                                      var previousPwd = user.oldPasswords[cnt].password;
                                      if(previousPwd == retHashPwd)
                                      {
                                        isLast5Password = true;
                                      }
                                      pwdCount++;
                                   }  
                                   else
                                      break;
                                 }
                             }
                             
                             if(isLast5Password)
                             {
                                  console.log("New password was set earlier. Password should not be from last 5 passwords");
                            			logger.debug("changePasswordRegister : Error : New password was set earlier. Password should not be from last 5 passwords");
                                  res.json({message:"Error : New password was set earlier. Password should not be from last 5 passwords"});  
                             }
                             else
                             {
                                secreateInfo.updateAsync({userId:user.userId},{$pushAll:{oldPasswords:[{password:retHashPwd}]},$set:{password:retHashPwd}},{ upsert: true },{customIdCondition: true}).then(function(updateStatus){
                                      logger.debug("CreateCollectionsAndRecord : Password updated successfully");                                
                                      res.json({message:"Password updated successfully..!!"});
                                  }).catch(function(err)
                                  {
                                    console.log("Error while updating password" + err);
                              			logger.debug("changePasswordRegister : Error : while updating the password" + err);
                                    res.json({message:"Error : while updating the password"});                    
                                  }); 
                             }
                           });
                        }).catch(function(err)
                         {
                              console.log("error in password hashing");
                              logger.debug("UserControl newPassword : Password is not valid");
                              res.json({message:"Error : Password is not valid"});
                         });                                   
                } 
            }).catch(function(err)
               {
                    console.log("Username or password is not valid");
                    logger.debug("UserControl newPassword : Username or password is not valid");
                    res.json({message:"Error : Username or password is not valid"});
               });   
        }
      }).catch(function(err)
       {
            console.log("Username does not exists");
            logger.debug("UserControl newPassword : Username does not exists " + retUserName);
            res.json({message:"Error : Username does not exists"});
       });    
  }
};

//Create record for user - security and details in PG db.
function CreateCollectionsAndRecordPG(res, pUserName, pPassword, pFirstName, pLastName, pGender, pAccountType, pCountry, pschemaName)
{
	//User security values.
	  var secreateInfo = new userSecurity();
    var userInfo = new userDetails();	
		var date = new Date();
		var appendToExternalId = date.getDate()+"v"+date.getMonth()+"r"+date.getFullYear();
    
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("ClientSave - Error while connection PG" + err);
        logger.debug("ClientSave - Error while connection PG" + err);
      }
      else
      {
        try
        {         
           //Check if user name exists.   
           clientConn.query("SELECT userid from "+pschemaName+".tbusersecurity WHERE username = $1", [pUserName], function(err, result)
           {
             if(err)
             {
                console.log("Error while verifying user " + err);
                logger.debug("UserControl register : Error while verifying user = " + err);
                res.json({message:"Error : Error while verifying user"}); 
             }   
             else
             {
               if(result && result.rows && result.rows.length > 0)
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
                        //Save the value in Mongo as well for logs and generating unique ObjId.   
                        secreateInfo.userId = mongoose.Types.ObjectId();
                    		secreateInfo.extId = appendToExternalId+ "" +secreateInfo.userId;              		    
                    		secreateInfo.password = retHashPwd;	
                    		secreateInfo.userName = pUserName;
                    		secreateInfo.oldPasswords = {"passwords":[retHashPwd]};
                        secreateInfo.status = false;       
                        return secreateInfo.saveAsync()}).then(function(userSaved){
                          logger.debug("CreateCollectionsAndRecordPG : Success : Secret record saved successfully");
                					console.log("Success : Secret record saved successfully");                       
                          
                          if(userSaved.length > 0)	
                        	   {userInfo.userId = userSaved[0].userId;}
                          else
                              {userInfo.userId = secreateInfo.userId;}
                          
                          try
                          {
                            //Begin the insert transaction to store values in secret and userdetails table.
                            //For any error rollback the transaction else commit.
                            clientConn.query("BEGIN", function(err, result)
                            {
                                if(err)
                                {
                                  console.log("Error while inserting user secrets " + err);
                                  logger.debug("UserControl register : Error while inserting user secrets " + err);
                                  conn.rollback(clientConn);
                                }
                                else
                                {
                                  var oldPasswordJson = '{"oldpasswords":["'+secreateInfo.password+'"]}';
                                  clientConn.query("INSERT INTO "+pschemaName+".tbusersecurity (userid, username, password, extid, oldpasswords, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING userid",
                                  [String(secreateInfo.userId), String(secreateInfo.userName), String(secreateInfo.password), String(secreateInfo.extId), oldPasswordJson, 1], function(err, result){
                                    if(err)
                                    {
                                      console.log("Error while inserting user secrets " + err);
                                      logger.debug("UserControl register : Error while inserting user secrets " + err);
                                      conn.rollback(clientConn);
                                      res.json({message:"Error : Error while inserting user secrets"}); 
                                    }
                                    else
                                    {
                                      if(result && result.rows && result.rows.length > 0)
                                      {
                                        clientConn.query("INSERT INTO "+pschemaName+".tbuserdetails (userid, firstname, lastname, gender, accounttype, country) VALUES ($1,$2,$3,$4,$5,$6) RETURNING userid",
                                        [String(secreateInfo.userId), pFirstName, pLastName, pGender, pAccountType, pCountry], function(err, result){
                                          if(err)
                                          {
                                            console.log("Error while inserting user details " + err);
                                            logger.debug("UserControl register : Error while inserting user details " + err);
                                            conn.rollback(clientConn);
                                            res.json({message:"Error : Error while inserting user details"}); 
                                          }
                                          else
                                          {
                                            console.log("User records saved successfully");
                                            logger.debug("Success : User records saved successfully");
                                            res.json({message:"Success : User records saved successfully"}); 
                                          }
                                          clientConn.query('COMMIT', clientConn.end.bind(clientConn));
                                        });
                                      }
                                    }                                    
                                  });   
                                }                           
                            });                            
                          }
                          catch(err)
                          {
                            clientConn.end();
                            console.log("Error while inserting user info");
                            logger.debug("UserControl register : Error while inserting user info");
                            res.json({message:"Error : Error while inserting user info"}); 
                          }
                          
                        }).catch(function(err)
                           {
                             console.log("Error while saving the records " + err);
                             logger.debug("CreateCollectionsAndRecordPG : Error while saving user info" + err);
                             res.json({message:"Error : Error while saving user info"});                 
                           });
                   }).catch(function(err)
                     {
                       console.log("GenSalth hashed password error " + err);
                       logger.debug("CreateCollectionsAndRecordPG : hash function failed" + err);
                       res.json({message:"Error : Hash function failed"});                 
                     });
               }
             }                 
           });
        }
        catch(err)
        {
          clientConn.end();
           console.log("ClientSave - Error while saving user PG" + err);
           logger.debug("ClientSave - Error while saving user PG" + err);
        }
      }
    });                      
}


//Create record for user - security and details in Mongodb only.
function CreateCollectionsAndRecordMongo(res, pUserName, pPassword, pFirstName, pLastName, pGender)
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
              		secreateInfo.oldPasswords = [{password:retHashPwd}];
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
       });                         
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