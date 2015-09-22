//Default packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var promise = require("bluebird");
var pg = require('pg');
var fs = require('fs');
var gm = require('gm');
//Custom packages
var userSecurity = require("../Modules/UserSecurityCollection.js");
var userDetails = require("../Modules/UserDetailsCollection.js");
var album = require("../Modules/Album.js");
var logger = require("../logger");
var conn = require("./Connection.js");
var utility = require("./Utility.js");

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

// Check if the user exists and return the message.
exports.checkUserorEmailAvailable = function(req, res) {  
  // Set the client properties that came from the POST data
  if(req.body && req.body.username && req.body.password)
  {
        
    var fieldToCheck = req.body.field;
    var valueToCheck = req.body.value;
    logger.debug("UserControl - Searching for login post");
    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("postUserLogin - Error while connection PG" + err);
        logger.debug("postUserLogin - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbusersecurity WHERE "+fieldToCheck+" = $1", [valueToCheck]).then(function(result)
         {            
           if(result && result.rows && result.rows.length > 0)
           {
             res.status(200);
             // Make sure the password is correct               
               res.json({status:'Error',message:"Value already exists"});
           }
           else
           {             
             res.status(200);
              res.json({message:"Value not found"});  
           }
         }).catch(function(err)
          {
             console.log("Value not found" + err);
              logger.debug("UserControl login : Value for "+fieldToCheck+" not found = " + userName);
              res.json({status:'Error',message:"Value for "+fieldToCheck+" not found"});  
          });
      }
    });
  }
  else
  {
    res.status(400);
     res.json({status:'Error',message:"Error : Parameter username and password cannot be blank"});
  }
};   

// Check if the user exists and return the message.
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
                      res.json({status:'Error',message:"Username or password not found"}); 
                    }
                    else
                    {
                      req.session.userid = result.rows[0].extid;
                      req.session.ruid = result.rows[0].userid;
                      req.session.username = userName;
                      res.status(200);
                      res.json({status:'Success',message:{"userid":result.rows[0].extid}}); 
                    }
                });
           }
           else
           {
              console.log("Username or password not found");
              logger.debug("UserControl login : Username or password not found = " + userName);
              res.json({status:'Error',message:"Username or password not found"});  
           }
         }).catch(function(err)
          {
             console.log("Username or password not found" + err);
              logger.debug("UserControl login : Username or password not found = " + userName);
              res.json({status:'Error',message:"Username or password not found"});  
          });
      }
    });
  }
  else
    {
      res.status(400);
      res.json({status:'Error',message:"Parameter username and password cannot be blank"});
    }
};   

// Check if the user is available, if not then add the details.
exports.postUserRegister = function(req, res) {  
  // Set the client properties that came from the POST data
  if(req.body && req.body.username && req.body.password)
  {
      var userName = req.body.username;
      var password = req.body.password;
      var fName = req.body.firstname;
      var lName = req.body.lastname;
      var gender = req.body.gender;
      var accountType = req.body.accounttype;
      var countryId = req.body.countryid;
      var schemaName = conn.getDBSchema(userName);
      
      if(userName == null || userName == "" || !utility.ValidateEmail(userName))
      {         
         logger.debug("UserControl register : Username is invalid = " + userName);
         res.json({status:'Error',message:"Username "+userName+" is invalid"});   
         res.end();
      }
      else if(password == null || password == "" || !utility.ValidatePassword(password))
      {
        // at least one number, one lowercase and one uppercase letter
        // at least six characters  
        logger.debug("UserControl register : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase");
         res.json({status:'Error',message:"Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase"});
         res.end();   
      }
      else if(fName == null || fName == "" || lName == null || lName == "")
      {
        logger.debug("UserControl register : FirstName or LastName cannot be blank");
         res.json({status:'Error',message:"FirstName or LastName cannot be blank"});
         res.end();   
      }
      else
      {      
        logger.debug("UserControl register :  Search and save registration.");
        CreateCollectionsAndRecordPG(res, userName, password, fName, lName, gender, accountType, countryId, schemaName);
      } 
    }
    else
    {
      res.status(400);
      res.json({status:'Error',message:"Parameter username and password cannot be blank"});
    }
};

// Get details of user and send it.
exports.getUserDetails = function(req, res) {  
  // Set the client properties that came from the POST data
  var userId = req.session.userid;
  if(userId && userId!="")
  {    
    
    logger.debug("UserControl - Searching for user details");    
     var pschemaName = conn.getDBSchema("");     
      conn.getPGConnection(function(err, clientConn)
      {    
        if(err)
        {
          console.log("postUserLogin - Error while connection PG" + err);
          logger.debug("postUserLogin - Error while connection PG" + err);
        }
        else
        {
          clientConn.queryAsync("SELECT us.extid, us.username,us.pageurlname, ud.firstname, ud.lastname, ud.gender, ud.addressline, ud.city, ud.state, co.countryid, co.countryname, ud.profpicfilename, ud.filetype,ud.filepath, ud.albumid, ud.accounttype,ud.qualificationtags, ud.professiontags, ud.skilltags,ud.joblocationpreftags, ud.matriexpectedqualification, ud.matriexpectedjob, ud.matriexpectedpreferedlocation,ud.groupstaggedto, ud.dateofbirth, ud.mobilenumber, ud.workdetails, ud.educationdetails, tz.timezoneid, tz.timezone, tz.timezoneminutes FROM "+pschemaName+".tbusersecurity us LEFT JOIN "+pschemaName+".tbuserdetails ud ON us.userid=ud.userid LEFT JOIN "+pschemaName+".tbcountryid co ON ud.country = co.countryid LEFT JOIN "+pschemaName+".tbtimezone tz ON ud.timezoneid = tz.timezoneid WHERE us.status <> 0 AND us.extid = $1 AND ud.issuperuser = false", [userId]).then(function(result)
           {              
              var userdetails = {};
             if(result && result.rows && result.rows.length > 0)
             {
               //Add user details in session
               userdetails = {"userdetails":{"extid":result.rows[0].extid,"username":result.rows[0].username,"pageurlname":result.rows[0].pageurlname,"firstname":result.rows[0].firstname,"lastname":result.rows[0].lastname,"gender":result.rows[0].gender,"addressline":result.rows[0].addressline,"city":result.rows[0].city,"state":result.rows[0].state,"countryid":result.rows[0].countryid,"countryname":result.rows[0].countryname,"profpicfilename":result.rows[0].profpicfilename,"filetype":result.rows[0].filetype,"filepath":result.rows[0].filepath,"albumid":result.rows[0].albumid,"accounttype":result.rows[0].accounttype,"qualificationtags":result.rows[0].qualificationtags,"professiontags":result.rows[0].professiontags,"skilltags":result.rows[0].skilltags,"joblocationpreftags":result.rows[0].joblocationpreftags,"matriexpectedqualification":result.rows[0].matriexpectedqualification,"matriexpectedjob":result.rows[0].matriexpectedjob,"matriexpectedpreferedlocation":result.rows[0].matriexpectedpreferedlocation,"groupstaggedto":result.rows[0].groupstaggedto,"dateofbirth":result.rows[0].dateofbirth,"mobilenumber":result.rows[0].mobilenumber,"workdetails":result.rows[0].workdetails,"educationdetails":result.rows[0].educationdetails,"timezoneid":result.rows[0].timezoneid,"timezone":result.rows[0].timezone,"timezoneminutes":result.rows[0].timezoneminutes}};
                
                req.session.userdetails = userdetails;
                res.status(200);
                res.json(userdetails);
             }
             else
             {
                console.log("User info not found");
                logger.debug("UserControl details : User info not found");
                res.json({status:'Error',"userdetails":null});  
             }
           }).catch(function(err)
            {
               console.log("User info not found " + err);
                logger.debug("UserControl details : User info not found "+ err);
                res.json({status:'Error',message:"User info not found " + err});  
            });
        }
      });
  }
  else
  {
    res.status(400);
    res.json({status:'Error',message:"User info not found as parameter was not passed"});
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
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbusersecurity WHERE username = $1", [retUserName]).then(function(result)
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
                       res.json({status:'Error',message:"Password is not valid"});
                       res.end();   
                    }      
                    else if(!utility.ValidatePassword(retNewPassword))
                    {
                      logger.debug("UserControl newPassword : Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase");
                       res.json({status:'Error',message:"Password should have min 6 and max 10 characters, one number, one lowercase and one uppercase"});
                       res.end();   
                    }
                    else
                    {      
                      logger.debug("UserControl new password :  Update new password.");                  
                      //Get the hash value.
                      bcrypt.genSaltAsync(5).then(function(salt) 
                      {        	       
                         bcrypt.hashAsync(retNewPassword, salt, null).then(function(hash) 
                    	    {
                    		      return hash;
                         }).then(function(retHashPwd)
                         {                           
                           //Check if password is from last 5 password list.
                           if(result && result.rows && result.rows.length > 0)
                           {
                              //get the json data from database.
                               passwordList = result.rows[0].oldpasswords.oldpasswords.slice();                               
                               //Verify if the new password is used in last 5 password list.
                               utility.VerifyPassword(0, retNewPassword, passwordList, false, function(err, isMatch)
                                 { 
                                   if(err)
                                   {
                                      console.log("Error while updating the password " + err);
                                      logger.debug("Error while updating the password " + err);
                                      res.json({status:'Error',message:"Error while updating the password " + err});
                                   }
                                   else
                                   {
                                       if(isMatch)
                                       {
                                            console.log("New password was set earlier. Password should not be from last 5 passwords");
                                      			logger.debug("changePasswordRegister : Error : New password was set earlier. Password should not be from last 5 passwords");
                                            res.json({status:'Error',message:"New password was set earlier. Password should not be from last 5 passwords"});  
                                       }
                                       else
                                       {
                                         if(passwordList != null)
                                         {
                                           try
                                           {
                                               //Push the new password at zeroth position.
                                               passwordList.splice(0,0,retHashPwd);
                                               var updatedPassword = '{"oldpasswords":' + JSON.stringify(passwordList) + '}';
                                                clientConn.queryAsync("UPDATE "+pschemaName+".tbusersecurity SET password=$1, oldpasswords=$2 WHERE userid = $3 RETURNING userid", [retHashPwd, JSON.parse(updatedPassword), result.rows[0].userid]).then(function(result){
                                                  
                                                    if(result && result.rows && result.rows.length>0)
                                                    {
                                                      logger.debug("CreateCollectionsAndRecord : Password updated successfully");
                                                      res.status(200);                                
                                                      res.json({status:'Success',message:"Password updated successfully..!!"});
                                                    }
                                                    else
                                                    {
                                                      console.log("Error while updating password");
                                                			logger.debug("changePasswordRegister : Error : while updating the password");
                                                      res.json({status:'Error',message:"Error while updating the password"});  
                                                    }
                                                    clientConn.end();
                                                }).catch(function(err)
                                                {
                                                   clientConn.end();
                                                  console.log("Error while updating password" + err);
                                            			logger.debug("changePasswordRegister : Error : while updating the password" + err);
                                                  res.json({status:'Error',message:"Error while updating the password"});                    
                                                });
                                           }  
                                           catch(err)
                                           {
                                              console.log("Error while updating password" + err);
                                            	logger.debug("changePasswordRegister : Error : while updating the password" + err);
                                              res.json({status:'Error',message:"Error while updating the password"});
                                           }
                                         }
                                         else
                                         {
                                              console.log("Error while updating password");
                                        			logger.debug("changePasswordRegister : Error : while updating the password");
                                              res.json({status:'Error',message:"Error while updating the password"});  
                                         }
                                          
                                       }
                                   }
                                 });
                           }
                         });
                      });           
                    }
                }).catch(function(err)
                         {
                              console.log("error in password hashing");
                              logger.debug("UserControl newPassword : Password is not valid");
                              res.json({status:'Error',message:"Error Password is not valid"});
                         });        
           }
           else
           {
              console.log("Username does not exists");
              logger.debug("UserControl changePasswordRegister : Username does not exists = " + retUserName);
              res.json({status:'Error',message:"Username does not exists"});
              return null;
           }
         }).catch(function(err)
           {
                console.log("Username does not exists");
                logger.debug("UserControl newPassword : Username does not exists " + retUserName);
                res.json({status:'Error',message:"Username does not exists"});
           });
      }
    });  
  }
  else
  {
    res.status(400);
    res.json({status:'Error',message:"Could not update the password as parameter was not passed"}); 
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
                res.json({status:'Error',message:"Error while verifying user"}); 
             }   
             else
             {
               if(result && result.rows && result.rows.length > 0)
               {
                  console.log("Username already exists");
                  logger.debug("UserControl register : Username already exists = " + pUserName);
                  res.json({status:'Error',message:"Username already exists"});  
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
                    		secreateInfo.extId = appendToExternalId+ "_" + String(secreateInfo.userId).substr(0,15);              		    
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
                                  clientConn.query("INSERT INTO "+pschemaName+".tbusersecurity (userid, username, password, extid, oldpasswords, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING extid",
                                  [String(secreateInfo.userId), String(secreateInfo.userName), String(secreateInfo.password), String(secreateInfo.extId), oldPasswordJson, 0], function(err, result){
                                    if(err)
                                    {
                                      console.log("Error while inserting user secrets " + err);
                                      logger.debug("UserControl register : Error while inserting user secrets " + err);
                                      conn.rollback(clientConn);
                                      res.json({status:'Error',message:"Error while inserting user secrets"}); 
                                    }
                                    else
                                    {
                                      if(result && result.rows && result.rows.length > 0)
                                      {
                                        var extUserId = result.rows[0].extid;
                                        clientConn.query("INSERT INTO "+pschemaName+".tbuserdetails (userid, firstname, lastname, gender, accounttype, country) VALUES ($1,$2,$3,$4,$5,$6) RETURNING userid",
                                        [String(secreateInfo.userId), pFirstName, pLastName, pGender, pAccountType, pCountry], function(err, result){
                                          if(err)
                                          {
                                            console.log("Error while inserting user details " + err);
                                            logger.debug("UserControl register : Error while inserting user details " + err);
                                            conn.rollback(clientConn);
                                            res.json({status:'Error',message:"Error while inserting user details"}); 
                                          }
                                          else
                                          {
                                            res.status(200);
                                            console.log("User records saved successfully");
                                            logger.debug("Success : User records saved successfully");
                                            res.json({status:'Success',message:{"userid":extUserId}}); 
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
                            res.json({status:'Error',message:"Error : Error while inserting user info"}); 
                          }
                          
                        }).catch(function(err)
                           {
                             console.log("Error while saving the records " + err);
                             logger.debug("CreateCollectionsAndRecordPG : Error while saving user info" + err);
                             res.json({status:'Error',message:"Error : Error while saving user info"});                 
                           });
                   }).catch(function(err)
                     {
                       console.log("GenSalth hashed password error " + err);
                       logger.debug("CreateCollectionsAndRecordPG : hash function failed" + err);
                       res.json({status:'Error',message:"Error : Hash function failed"});                 
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
};

// Update user information for the registered users.
exports.updateUserDetails = function(req, res) {  
  // Set the client properties that came from the POST data
  var userId = req.session.userid;
  if(userId && userId!="" && req.body && req.body.firstname && req.body.lastname)
  {     
     var fName = req.body.firstname;
     var lName = req.body.lastname;
     var gender = req.body.gender;
     var accountType = req.body.accounttype;     
     var dateOfbirth = req.body.dateofbirth;
     var addressLine = req.body.addressline;
     var city = req.body.city;
     var state = req.body.state;
     var countryId = req.body.countryid;
     var timezoneId = req.body.timezoneid;
    logger.debug("UserControl - Searching for login post");
    
    var dateFormated = utility.ValidateDateOfBirth(dateOfbirth);
    if(dateFormated)
    {
        var pschemaName = conn.getDBSchema("");     
        conn.getPGConnection(function(err, clientConn)
        {    
          if(err)
          {
            console.log("updateUser - Error while connection PG" + err);
            logger.debug("updateUser - Error while connection PG" + err);
          }
          else
          {
            clientConn.queryAsync("UPDATE "+pschemaName+".tbuserdetails SET firstname=$1, lastname=$2, gender=$3, addressline=$4, city=$5, state=$6, country=$7, accounttype=$8, timezoneid=$9, dateOfbirth=$10 FROM "+pschemaName+".tbusersecurity us LEFT JOIN "+pschemaName+".tbuserdetails ud ON us.userid = ud.userid WHERE us.extid = $11 RETURNING extid", [fName,lName,gender,addressLine,city,state,countryId,accountType,timezoneId,dateFormated,userId]).then(function(result)
             {            
               if(result && result.rows && result.rows.length > 0)
               {
                 // Make sure the password is correct
                 res.status(200);
                 res.json({status:'Success',message:"Success"});                
               }
               else
               {
                  console.log("User could not be updated");
                  logger.debug("updateUser : User could not be updated");
                  res.json({status:'Error',message:"User could not be updated"});  
               }
             }).catch(function(err)
              {
                 console.log("User could not be updated" + err);
                  logger.debug("updateUser : User could not be updated = " + err);
                  res.json({status:'Error',message:"User could not be updated"});  
              });
          }
        });
    }
    else
    {
      res.json({status:'Error',message:"Date of birth is not valid"});
    }
  }
  else
  {
    res.status(400);
    res.json({status:'Error',message:"User could not be updated as parameter was not passed"});  
  }
};   

// Update mobile information for the registered users.
exports.updateMobileNumber = function(req, res) {  
  // Set the client properties that came from the POST data
  var userId = req.session.userid;
  if(userId && userId!="" && req.body && req.body.mobileno)
  {     
     var mobilenumber = req.body.mobileno;
     
    logger.debug("UserControl - Searching for login post");
    
    var isValidMob = utility.ValidateMobileNumber(mobilenumber);
    if(isValidMob)
    {
        var pschemaName = conn.getDBSchema("");     
        conn.getPGConnection(function(err, clientConn)
        {    
          if(err)
          {
            console.log("updateUser - Error while connection PG" + err);
            logger.debug("updateUser - Error while connection PG" + err);
          }
          else
          {
            clientConn.queryAsync("UPDATE "+pschemaName+".tbuserdetails SET mobilenumber=$1 FROM "+pschemaName+".tbusersecurity us LEFT JOIN "+pschemaName+".tbuserdetails ud ON us.userid = ud.userid WHERE us.extid = $2 RETURNING extid", [mobilenumber,userId]).then(function(result)
             {            
               if(result && result.rows && result.rows.length > 0)
               {
                 // Make sure the password is correct
                 res.status(200);
                 res.json({status:'Success',message:"Success"});                
               }
               else
               {
                  console.log("Mobile number could not be updated");
                  logger.debug("updateUser : Mobile number could not be updated");
                  res.json({status:'Error',message:"Mobile number could not be updated"});  
               }
             }).catch(function(err)
              {
                 console.log("Mobile number could not be updated" + err);
                  logger.debug("updateUser : Mobile number could not be updated = " + err);
                  res.json({status:'Error',message:"Error : Mobile number could not be updated"});  
              });
          }
        });
    }
    else
    {
      res.status(400);
      res.json({status:'Error',message:"Error : Mobile number is not valid"});
    }
  }
  else
  {
    res.status(400);
    res.json({status:'Error',message:"Error : Mobile number is not valid as parameter was not passed"});
  }
};  

// Update work information for the registered users.
exports.updateWorkDetails = function(req, res) {  
  // Set the client properties that came from the POST data
  var userId = req.session.userid;
  if(userId && userId!="" && req.body && req.body.workdetailsJSON)
  {     
     var workDetails = JSON.parse(req.body.workdetailsJSON);
     
    logger.debug("UserControl - Updating work details");
    
      var pschemaName = conn.getDBSchema("");     
      conn.getPGConnection(function(err, clientConn)
      {    
        if(err)
        {
          console.log("updateWorkDetails - Error while connection PG" + err);
          logger.debug("updateWorkDetails - Error while connection PG" + err);
        }
        else
        {
          clientConn.queryAsync("UPDATE "+pschemaName+".tbuserdetails SET workdetails=$1 FROM "+pschemaName+".tbusersecurity us LEFT JOIN "+pschemaName+".tbuserdetails ud ON us.userid = ud.userid WHERE us.extid = $2 RETURNING extid", [workDetails,userId]).then(function(result)
           {            
             if(result && result.rows && result.rows.length > 0)
             {
               // Make sure the password is correct
               res.status(200);
               res.json({status:'Success',message:"Success"});                
             }
             else
             {
                console.log("Work information could not be updated");
                logger.debug("updateWorkDetails : Work information could not be updated");
                res.json({status:'Error',message:"Work information could not be updated"});  
             }
           }).catch(function(err)
            {
               console.log("Work information could not be updated" + err);
                logger.debug("updateUser : Work information could not be updated = " + err);
                res.json({status:'Error',message:"Error : Work information could not be updated"});  
            });
        }
      });    
  }
  else
  {
    res.status(400);
    res.json({status:'Error',message:"Error : Work information could not be updated as parameter was not passed"});  
  }
};  

// Update work information for the registered users.
exports.updateEducationDetails = function(req, res) {  
  // Set the client properties that came from the POST data
  var userId = req.session.userid;
  if(userId && userId!="" && req.body && req.body.educationdetailsJSON)
  {     
     var educationDetails = JSON.parse(req.body.educationdetailsJSON);
     
    logger.debug("UserControl - Updating work details");
    
      var pschemaName = conn.getDBSchema("");     
      conn.getPGConnection(function(err, clientConn)
      {    
        if(err)
        {
          console.log("updateEducationDetails - Error while connection PG" + err);
          logger.debug("updateEducationDetails - Error while connection PG" + err);
        }
        else
        {
          clientConn.queryAsync("UPDATE "+pschemaName+".tbuserdetails SET educationdetails=$1 FROM "+pschemaName+".tbusersecurity us LEFT JOIN "+pschemaName+".tbuserdetails ud ON us.userid = ud.userid WHERE us.extid = $2 RETURNING extid", [educationDetails,userId]).then(function(result)
           {            
             if(result && result.rows && result.rows.length > 0)
             {
               // Make sure the password is correct
               res.status(200);
               res.json({status:'Success',message:"Success"});                
             }
             else
             {
                console.log("Education information could not be updated");
                logger.debug("updateEducationDetails : Work information could not be updated");
                res.json({status:'Error',message:"Education information could not be updated"});  
             }
           }).catch(function(err)
            {
               console.log("Education information could not be updated" + err);
                logger.debug("updateEducationDetails : Education information could not be updated = " + err);
                res.json({status:'Error',message:"Error : Education information could not be updated"});  
            });
        }
      });    
  }
  else
  {
    res.status(400);
     res.json({status:'Error',message:"Error : Education information could not be updated as parameter was not passed"});  
  }
};  

// Update work information for the registered users.
//Status -1=inactive user as family member, 0=inactive, 1=active, 2=rip and 3=disabled
exports.updateUserStatus = function(req, res) {  
  // Set the client properties that came from the POST data
  var userId = (req.session.userid)?req.session.userid : req.query.uid;
  //If its not post request then get the value from get querystring.
  var enableUser = (req.body.enableuser)? req.body.enableuser : req.query.stats;
  if(userId && userId!="" && req.body && enableUser)
  {  
    logger.debug("UserControl - Updating work details");
     var updateStatusVal;
     if(enableUser == '1' || enableUser == 1)
     {
       updateStatusVal = 'enabled';
     }
     else if(enableUser == '0' || enableUser == 0)
     {
       updateStatusVal = 'inactive';
     }
     else if(enableUser == '2' || enableUser == 2)
     {
       updateStatusVal = 'rip';
     }
     else if(enableUser == '3' || enableUser == 3)
     {
       updateStatusVal = 'disabled';
     }
      var pschemaName = conn.getDBSchema("");     
      conn.getPGConnection(function(err, clientConn)
      {    
        if(err)
        {
          console.log("updateEducationDetails - Error while connection PG" + err);
          logger.debug("updateEducationDetails - Error while connection PG" + err);
        }
        else
        {
          clientConn.queryAsync("UPDATE "+pschemaName+".tbusersecurity SET status=$1 WHERE extid = $2 RETURNING extid", [enableUser,userId]).then(function(result)
           {            
             if(result && result.rows && result.rows.length > 0)
             {
               // Make sure the password is correct
               res.status(200);
               res.json({status:'Success',message:"Success"});                
             }
             else
             {  
                console.log("User was not "+updateStatusVal);
                logger.debug("updateEducationDetails : User was not "+updateStatusVal);
                res.json({status:'Error',message:"User could not be "+ updateStatusVal});  
             }
           }).catch(function(err)
            {
               console.log("User was not "+ updateStatusVal +" -> " + err);
                logger.debug("updateEducationDetails : User was not "+ updateStatusVal +" -> " + err);
                res.json({status:'Error',message:"Error : User was not "+ updateStatusVal });  
            });
        }
      });    
  }
  else
  {
    res.status(400);
     res.json({status:'Error',message:"Error : User status was not updated as parameter was not passed"});  
  }
};  

// Update work information for the registered users.
exports.profilePicUpload = function(req, res) {  
  // Set the client properties that came from the POST data
  var userId = req.session.userid;
  if(userId && userId!="")
  {  
    var fstream;
    try
    {
      req.pipe(req.busboy);
      req.busboy.on('file', function (fieldname, file, filename, mimetype) {
        var newfileext = filename.substr(filename.lastIndexOf("."), (filename.length - filename.lastIndexOf(".")));
        //Check for valid file extensions.
        if(newfileext.toLowerCase() == ".jpeg" || newfileext.toLowerCase() == ".jpg" || newfileext.toLowerCase() == ".gif" || newfileext.toLowerCase() == ".png")
        {
          //set the image upload path
          var imagePath = __dirname.replace('Controller','ImageUploads');
          console.log("Uploading: " + filename);          
          var newfilename = userId+newfileext;
          //Upload the file on server
          fstream = fs.createWriteStream(imagePath + '/Album/' + newfilename);
          file.pipe(fstream);
          fstream.on('close', function () {
              //Resize the file for profile picture.
               gm(imagePath + '/Album/' + newfilename)
                  .resize(200)
                  .write(imagePath + '/ProfilePics/' + newfilename, function (err) 
                    {
                      //If resize and upload is successfull, then save the values in DB.
                      if (err)
                      { 
                        console.log(err);
                        logger.debug("Error while uploading Profile picture " +err);
                         res.status(400);
                         res.json({status:'Error',message:"Error : Profile picture could not be uploaded"});
                      }
                      else
                      {
                        conn.getPGConnection(function(err, clientConn)
                        {    
                          if(err)
                          {
                            console.log("profilePicUpload - Error while connection PG" + err);
                            logger.debug("profilePicUpload - Error while connection PG" + err);
                          }
                          else
                          {
                            var pschemaName = conn.getDBSchema("");  
                            //save the album / picture in mongo db.
                            var profileAlbum = new album();
                            profileAlbum.albumForUId = userId;                                                        
                            profileAlbum.albumList = [{albumId:mongoose.Types.ObjectId(),
                                      		albumName:"Profile Pictures", access:"Public", sharedWithUserId:[], description:"Profile Pictures Album", 
                                          pictures:[{fileName:newfilename, filePath:imagePath + '/ProfilePics/' + newfilename,fileDescription:"Profile Picture",
                                            totalViews:0,viewUserId:[],wows:0,wowsUserId:[]}]}];
                            profileAlbum.saveAsync().then(function(profPicSaved)
                            {
                              //Save the details in PG.
                               clientConn.queryAsync("UPDATE "+pschemaName+".tbuserdetails SET profpicfilename=$1,filetype=$2,filepath=$3 WHERE extid = $4 RETURNING extid", [newfilename,newfileext,imagePath + '/ProfilePics/' + newfilename,userId]).then(function(result)
                               {            
                                 if(result && result.rows && result.rows.length > 0)
                                 {                                   
                                   res.status(200);
                                   res.json({message:"Success"});                
                                 }
                                 else
                                 {  
                                    console.log("User was not able to upload profile picture");
                                    logger.debug("updateEducationDetails : User was not able to upload profile picture");
                                    res.json({message:"User could not  able to upload profile picture"});  
                                 }
                               }).catch(function(err)
                                {
                                   console.log("User was not  able to upload profile picture + err");
                                    logger.debug("updateEducationDetails : User was not able to upload profile picture" + err);
                                    res.json({message:"Error : User was not able to upload profile picture"});  
                                });
                            }).catch(function(err){
                                console.log("Error while saving profile picture " + err);
                      			    logger.debug("profilePicUpload : Error : while saving profile picture " + err);
                                res.json({message:"Error : while saving profile picture"}); 
                            });  
                          }
                        });   
                      }
                  });
              res.redirect('back');
          });
        }
        else
        {
            res.status(400);
            res.json({message:"Error : Filetype "+mimetype+" not supported. Please convert it to jpeg, jpg, gif or png"});        
        }
      });
    }
    catch(err){res.status(400);
            res.json({message:"Error : Could not upload the file"});}
  }
  else
  {
      res.status(400);
     res.json({message:"Error : Picture could not be uploaded as parameters were not set."});
  }
};
