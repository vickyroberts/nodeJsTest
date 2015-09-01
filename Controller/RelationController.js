//Default packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var promise = require("bluebird");
var pg = require('pg');
var fs = require('fs');
//Custom packages
var logger = require("../logger");
var conn = require("./Connection.js");
var userSecurity = require("../Modules/UserSecurityCollection.js");
var userDetails = require("../Modules/UserDetailsCollection.js");
var relationModule = require("../Modules/RelationCollection.js");
var propertyFile = require("../PropertiesValue.js");
var utility = require("./Utility.js");

promise.promisifyAll(mongoose);
promise.promisifyAll(pg);


// Check if the user is available, if not then add the details.
exports.postNewMemberRegister = function(req, res) {  
  // Set the client properties that came from the POST data
  if(req.body && req.body.email && req.body.relation && req.body.firstname && req.body.lastname && req.body.gender && req.body.treelevel)
  {
      var emailId = req.body.email;
      var relation = req.body.relation;
      var fName = req.body.firstname;
      var lName = req.body.lastname;
      var gender = req.body.gender;
      var accountType = propertyFile.accountTypePersonal;
      var treeLevel = req.body.treelevel;
      var treeName = req.body.treename;
      //var profPicture = req.body.treelevel;
      console.log("Add profile picture for member");
      var schemaName = conn.getDBSchema(emailId);
      
      if(emailId == null || emailId == "" || !utility.ValidateEmail(emailId))
      {         
         logger.debug("RelationController NewMember : Email is invalid = " + emailId);
         res.json({status:'Error',message:"Email "+emailId+" is invalid"});   
         res.end();
      }
      else if(relation == null || relation == "")
      {        
        logger.debug("RelationController NewMember : Please mention relation");
         res.json({status:'Error',message:"RelationController NewMember : Please mention relation"});
         res.end();   
      }
      else if(fName == null || fName == "" || lName == null || lName == "")
      {
        logger.debug("RelationController NewMember : FirstName or LastName cannot be blank");
         res.json({status:'Error',message:"FirstName or LastName cannot be blank"});
         res.end();   
      }
      else
      {      
        logger.debug("RelationController NewMember :  Search and save registration.");
        CreateCollectionsAndRecordPG(res, req, emailId, relation, fName, lName, gender, accountType, treeLevel, treeName, schemaName);
      } 
    }
    else
    {
      res.status(400);
      res.json({status:'Error',message:"Parameter first name, email or relation cannot be blank"});
    }
};

//Create record for user - security and details in PG db.
function CreateCollectionsAndRecordPG(res, req, pEmailId, pRelation, pFirstName, pLastName, pGender, pAccountType, pTreeLevel, pTreeName, pschemaName)
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
           clientConn.query("SELECT userid from "+pschemaName+".tbusersecurity WHERE username = $1", [pEmailId], function(err, result)
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
                  console.log("User already exists");
                  logger.debug("Relation register : User already exists = " + pEmailId);
                  res.json({status:'Error',message:"User already exists"});  
               }
               else
               {          
                  //SAVE UserSecret Code Starts
                  var retHashPwd = utility.generateRandomUId(6);
                  logger.debug("SAVE UserSecret Code Starts");
                  //Save the value in Mongo as well for logs and generating unique ObjId.   
                  secreateInfo.userId = mongoose.Types.ObjectId();
                  secreateInfo.extId = appendToExternalId+ "_" + String(secreateInfo.userId).substr(0,15);              		    
                  secreateInfo.password = retHashPwd;	
                  secreateInfo.userName = pEmailId;
                  secreateInfo.oldPasswords = {"passwords":[retHashPwd]};
                  secreateInfo.status = false;       
                  secreateInfo.saveAsync().then(function(userSaved){
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
                            logger.debug("RelationControl register : Error while inserting user secrets " + err);
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
                                logger.debug("RelationControl register : Error while inserting user secrets " + err);
                                conn.rollback(clientConn);
                                res.json({status:'Error',message:"Error while inserting user secrets"}); 
                              }
                              else
                              {
                                if(result && result.rows && result.rows.length > 0)
                                {
                                  var extUserId = result.rows[0].extid;
                                  clientConn.query("INSERT INTO "+pschemaName+".tbuserdetails (userid, firstname, lastname, gender, accounttype) VALUES ($1,$2,$3,$4,$5,$6) RETURNING userid",
                                  [String(secreateInfo.userId), pFirstName, pLastName, pGender, pAccountType], function(err, result){
                                    if(err)
                                    {
                                      console.log("Error while inserting user details " + err);
                                      logger.debug("RelationControl register : Error while inserting user details " + err);
                                      conn.rollback(clientConn);
                                      res.json({status:'Error',message:"Error while inserting user details"}); 
                                    }
                                    else
                                    {
                                      res.status(200);
                                      console.log("User records saved successfully");
                                      logger.debug("Success : User records saved successfully");
                                      
                                      relationModule.findOne({ 'trees.treeName': pTreeName},{ hooksForUserId: req.session.ruid }).then(function (treeObj) {
                                        if(treeObj)
                                        {
                                          var relationJson = {userId: secreateInfo.userId, treeLevel:pTreeLevel, relation:pRelation, color:propertyFile.defaultTreeColor};
                                          //Update the new tree to the existing user relationship collection.
                                          relationModule.updateAsync({hooksForUserId:req.session.ruid, 'trees.treeName': pTreeName},{"$set":{"trees.$.relations":[relationJson]}},
                                            { multi: false }).then(function(result){
                                              logger.debug('Update success');
                                              res.json({status:'Success',message:'Relation added successfully'});
                                            }).catch(function(err)
                                            {
                                              logger.debug('Error while updating the new relation '+err);
                                              console.log('Error while updating the new relation '+err);
                                              res.json({status:'Error', message:'Error while updating the new relation '+err});
                                            });
                                          
                                        }
                                        else
                                        {
                                          res.json({status:'Error', message:'Tree '+pTreeName+' does not exists'});
                                        }
                                      }).catch(function(err)
                                        {
                                          logger.debug('Tree with same name already exists '+err);
                                          console.log('Tree with same name already exists '+err);
                                          res.json({status:'Error', message:'Tree with same name already exists '+err});
                                        });
                                      
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

//Add a new tree for the user. This function will add only tree and not relations.
exports.addNewTree = function(req, res) {
  //Check if the tree name parameter is passed and user id is available in the session.
  if(req.body && req.body.treename && req.session.ruid)
  {  
    //Check if even one tree is available for the user.    
    relationModule.findOne({ hooksForUserId: req.session.ruid }).then(function (relation) {
      var treeNameVal = (req.body.treename) ? req.body.treename : propertyFile.defaultTreeName; 
      if(relation)
      {        
        relationModule.findOne({ 'trees.treeName': treeNameVal},{ hooksForUserId: req.session.ruid }).then(function (treeObj) {
          if(treeObj)
          {
            res.json({status:'Error', message:'Tree with same name already exists'});
          }
          else
          {
            //Update the new tree to the existing user relationship collection.
            relationModule.updateAsync({hooksForUserId:req.session.ruid},{$pushAll:{trees:[{treeName:treeNameVal,relations:[]}]}},
              { multi: false }).then(function(result){
                logger.debug('Update success');
                res.json({status:'Success',message:'Tree added successfully'});
              }).catch(function(err)
              {
                logger.debug('Error while updating the new tree '+err);
                console.log('Error while updating the new tree '+err);
                res.json({status:'Error', message:'Error while updating the new tree '+err});
              });
          }
        }).catch(function(err)
          {
            logger.debug('Tree with same name already exists '+err);
            console.log('Tree with same name already exists '+err);
            res.json({status:'Error', message:'Tree with same name already exists '+err});
          });        
      }
      else
      {
        //Add the user tree to the relation collection.
        var relationObj = new relationModule();
        relationObj.hooksForUserId = req.session.ruid;
        relationObj.trees = [{treeName:treeNameVal, relations:[],status:true}];
        relationObj.saveAsync().then(function(savedResult){
          console.log('Success in saving the relation');
          res.json({status:'Success',message:'Tree added successfully'});
        }).catch(function(err)
          {
            logger.debug('Error while adding the tree '+err);
            console.log('Error while adding the tree '+err);
            res.json({status:'Error', message:'Error while adding the tree '+err});
          });
      }
    }).catch(function(err)
    {
      logger.debug('Error while searching user tree '+err);
      console.log('Error while searching user tree '+err);
      res.json({status:'Error', message:'Error while searching user tree '+err});
    });
  }
};

