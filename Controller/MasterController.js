//Default packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var promise = require("bluebird");
var pg = require('pg');
//Custom packages
var logger = require("../logger");
var conn = require("./Connection.js");
var propertyFile = require("../PropertiesValue.js");

promise.promisifyAll(mongoose);
promise.promisifyAll(pg);

//Get the list of master data from Cache or database.
exports.getMasterListJson = function(req, res) 
{
    try
    {
    //Check if the values are available in Redis cache else regenerate the list.
      conn.redisClientObject(null, null, function(err, client)
      {
        if(!err)
        {
          client.get('masterData', function(err, result)
            {
              if(err || !result)
              {
                 createMasterList(req, res);                  
              }
              else
              {
                res.send({message: JSON.parse(result)});
              }
            });          
        } 
        else
        {
          createMasterList(req, res);           
        }
      });
    }
    catch(err)
    {
      console.log("MasterControl - Error while caching master list " + err);
      logger.debug("MasterControl - Error while caching existing master list " + err);
    }    
};


//Get the list of Activity master data from Cache or database.
exports.getActivityMasterListJson = function(req, res) 
{
    try
    {
    //Check if the values are available in Redis cache else regenerate the list.
      conn.redisClientObject(null, null, function(err, client)
      {
        if(!err)
        {
          client.get('masterActivityData', function(err, result)
            {
              if(err || !result)
              {
                getActivityJsonList(function(err, result){
                  
                  if(err)
                  {
                    res.send({status:'Error',message: "Error : Error while getting activity master list"});
                  }
                  else
                  {
                    res.send({status:'Success',message: JSON.parse(result)});
                  }
                });
              }
            });
        }
        else
        {
              getActivityJsonList(function(err, result){                  
                  if(err)
                  {
                    res.send({status:'Error',message: "Error : Error while getting activity master list"});
                  }
                  else
                  {
                    res.send({status:'Success',message: JSON.parse(result)});
                  }
                });
        }
      });
    }
    catch(err)
    {
      console.log("MasterControl - Error while caching activity master list " + err);
      logger.debug("MasterControl - Error while caching activity master list " + err);
    }
}

// Get the country list from country table.
function getActivityJsonList(callback){  
      
    logger.debug("MasterControl - start activity list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbactivitytype").then(function(result)
         {            
           //If countries are available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var activityJson = '{"activityMaster":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                activityJson = activityJson + '{"activityId":'+result.rows[loopCnt].activitytypeid+',"activityName":"'+result.rows[loopCnt].activityname+'","sendNotification":'+result.rows[loopCnt].sendnotification+',"notificationPriority":'+result.rows[loopCnt].notificationpriority+'}';
                if(loopCnt < (result.rows.length - 1))
                {
                  activityJson = activityJson + ',';
                }
              }
              activityJson = activityJson + ']}';   
              
              
               conn.redisClientObject(null, null, function(err, client)
                {
                  if(!err)
                  {
                    client.set('masterActivityData', activityJson);
                    client.expire('masterActivityData', propertyFile.redisExpiryMasterSecs);
                    callback(null,activityJson);
                  } 
                  else
                  {
                    console.log('could not write to redis')
                    callback(null,activityJson);
                  }   
                });
           }
           else
           { 
              callback("Error : Activity list is empty");  
           }
         }).catch(function(err)
          {
             
             console.log("Value not found" + err);
              logger.debug("MasterControl activity : Activity list is empty");
              callback("Error : Activity master list is empty");  
          });
      }
    });
 };        

//This function will refresh the master list in Redis cache.
exports.refreshMasterListJson = function(req, res) 
{
   //Check if the values are available in Redis cache else regenerate the list.
    conn.redisClientObject(null, null, function(err, client)
    {
      if(!err)
      {
        client.del('masterData', function(err, result)
          {
            if(err)
            {
                res.send({message: "Error : Error while deleting existing master list"});
                console.log("MasterControl - Error while deleting existing master list " + err);
                logger.debug("MasterControl - Error while deleting existing master list " + err);
            }
            else
            {
                client.get('masterData', function(err, result)
                {
                  if(err || !result)
                  {
                    createMasterList(req, res);                     
                  }
                  else
                  {
                    res.send({message: JSON.parse(result)});
                  }
                });
            }
          });          
      } 
      else
      {
        createMasterList(req, res);       
      }  
        
    });  
};


//Get list of all master records in one json struc.
function createMasterList(req, res)
{  
    console.log('Re-generating master function');
    var masterList = '{"masterList":[';    
    getCountryList(function(err, countryList)
      {
          if(!err)
          {      
            masterList = masterList + countryList;
            getFloatOptionList(function(err, floatOpList)
            { 
              if(!err)
              {             
                masterList = masterList + ",";
                masterList = masterList + floatOpList;
                getAccountOptionList(function(err, acctOptionList)
                  {
                    if(!err)
                    {
                      masterList = masterList + ",";
                      masterList = masterList + acctOptionList;
                      getGroupOptionList(function(err, grpOptionList)
                        {
                          if(!err)
                          {
                            masterList = masterList + ",";
                            masterList = masterList + grpOptionList;                            
                             getJobLocationPrefList(function(err, jobLocPList)
                              {
                                if(!err)
                                {
                                  masterList = masterList + ",";
                                  masterList = masterList + jobLocPList;
                                    getMatriExpectedJobsList(function(err, matriExpJobList)
                                      {
                                        if(!err)
                                        {
                                          masterList = masterList + ",";
                                          masterList = masterList + matriExpJobList;
                                            getMatriExpectedLocationList(function(err, matriExLocList)
                                              {
                                                if(!err)
                                                {
                                                  masterList = masterList + ",";
                                                  masterList = masterList + matriExLocList;
                                                    getMatriExpectedQualificationList(function(err, matriQualiList)
                                                      {
                                                        if(!err)
                                                        {
                                                          masterList = masterList + ",";
                                                          masterList = masterList + matriQualiList;
                                                            getQualificationList(function(err, qualiList)
                                                              {
                                                                if(!err)
                                                                {
                                                                  masterList = masterList + ",";
                                                                  masterList = masterList + qualiList;
                                                                  getRelationList(function(err, relList)
                                                                    {
                                                                      if(!err)
                                                                      {
                                                                        masterList = masterList + ",";
                                                                        masterList = masterList + relList;
                                                                        getSkillsList(function(err, skList)
                                                                          {
                                                                            if(!err)
                                                                            {
                                                                              masterList = masterList + ",";
                                                                              masterList = masterList + skList;
                                                                                getTimezoneList(function(err, tzList)
                                                                                  {
                                                                                    if(!err)
                                                                                    {
                                                                                      try
                                                                                      {
                                                                                      masterList = masterList + ",";
                                                                                      masterList = masterList + tzList;
                                                                                      //End of JSON struct.
                                                                                      masterList = masterList + "]}";
                                                                                      conn.redisClientObject(null, null, function(err, client)
                                                                                        {
                                                                                          if(!err)
                                                                                          {
                                                                                            client.set('masterData', masterList);
                                                                                            client.expire('masterData', propertyFile.redisExpiryMasterSecs);
                                                                                            res.send({status:'Success',message: JSON.parse(masterList)});
                                                                                          } 
                                                                                          else
                                                                                          {
                                                                                            console.log('could not write to redis')
                                                                                            res.send({status:'Error',message: JSON.parse(masterList)});
                                                                                          }   
                                                                                        });                                                                                      
                                                                                      
                                                                                      }
                                                                                      catch(err)
                                                                                      {
                                                                                        res.send({status:'Error',message: "Error : Master JSON is blank " + err});
                                                                                      }
                                                                                    }
                                                                                    else
                                                                                    {
                                                                                      masterList = "";
                                                                                    }
                                                                                  });
                                                                            }
                                                                            else
                                                                            {
                                                                              masterList = "";
                                                                            }
                                                                          });
                                                                      }
                                                                      else
                                                                      {
                                                                        masterList = "";
                                                                      }
                                                                    });
                                                                }
                                                                else
                                                                {
                                                                  masterList = "";
                                                                }
                                                              });
                                                        }
                                                        else
                                                        {
                                                          masterList = "";
                                                        }
                                                      });
                                                }
                                                else
                                                {
                                                  masterList = "";
                                                }
                                              });
                                        }
                                        else
                                        {
                                          masterList = "";
                                        }
                                      });
                                }
                                else
                                {
                                  masterList = "";
                                }
                              });
                          }
                          else
                          {
                            masterList = "";
                          }
                        });
                    }
                    else
                    {
                      masterList = "";
                    }
                  });
              }
              else
              {
                masterList = "";    
              }
            });            
          }
          else
          {
            masterList = "";
          }           
          
          if(masterList == "")
          {
            res.send({status:'Error',message:"Error : Master JSON is blank"})
          } 
      }
    );
}

// Get the country list from country table.
function getCountryList(callback){  
      
    logger.debug("MasterControl - start country list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbcountryid").then(function(result)
         {            
           //If countries are available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var countryJson = '{"countryList":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                countryJson = countryJson + '{"countryId":'+result.rows[loopCnt].countryid+',"countryName":"'+result.rows[loopCnt].countryname+'","countryCode":'+result.rows[loopCnt].countrycode+'}';
                if(loopCnt < (result.rows.length - 1))
                {
                  countryJson = countryJson + ',';
                }
              }
              countryJson = countryJson + ']}';                           
              callback(null, countryJson);
           }
           else
           { 
              callback("Error : Country list is empty");  
           }
         }).catch(function(err)
          {
             
             console.log("Value not found" + err);
              logger.debug("MasterControl country : Country list is empty");
              callback("Error : Country list is empty");  
          });
      }
    });
 };  
 
 // Get the float type list from table.
function getFloatOptionList(callback){  
      
    logger.debug("MasterControl - start float option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbfloattype").then(function(result)
         {            
           //If float types are available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var floatJson = '{"floatOption":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                floatJson = floatJson + '{"floatOptionId":'+result.rows[loopCnt].floattypeid+',"floatOptionName":"'+result.rows[loopCnt].floattypename+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  floatJson = floatJson + ',';
                }
              }
              floatJson = floatJson + ']}';
              callback(null, floatJson);
           }
           else
           {             
             callback("Error : Float option is empty");
           }
         }).catch(function(err)
          {             
             console.log("Value not found" + err);
              logger.debug("MasterControl floatoption : Country list is empty");
              callback("Error : Float option is empty");
          });
      }
    });
 };  
 
  // Get the Account type list from table.
function getAccountOptionList(callback){ 
      
    logger.debug("MasterControl - start account option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbaccounttype").then(function(result)
         {            
           //If Account types are available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var accountJson = '{"accountOption":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                accountJson = accountJson + '{"accountOptionId":'+result.rows[loopCnt].accounttypeid+',"accountOptionName":"'+result.rows[loopCnt].accounttypename+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  accountJson = accountJson + ',';
                }
              }
              accountJson = accountJson + ']}';
               callback(null, accountJson);
           }
           else
           {          
             callback("Error : Account option is empty");
           }
         }).catch(function(err)
          {             
             console.log("Account Value not found" + err);
              logger.debug("MasterControl Account : Country list is empty");
              callback("Error : Account option is empty");
          });
      }
    });
 };  
 
// Get the Group type list from table.
function getGroupOptionList(callback){  
      
    logger.debug("MasterControl - start Group option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbgrouptype").then(function(result)
         {            
           //If Group types are available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var groupJson = '{"groupOption":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                groupJson = groupJson + '{"groupOptionId":'+result.rows[loopCnt].grouptypeid+',"groupOptionName":"'+result.rows[loopCnt].grouptypename+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  groupJson = groupJson + ',';
                }
              }
              groupJson = groupJson + ']}';
              callback(null, groupJson);
           }
           else
           {         
             callback("Error : Group option list is empty");
           }
         }).catch(function(err)
          {             
             console.log("Group Value not found" + err);
              logger.debug("MasterControl Group : Group list is empty");
              callback("Error : Group option is empty");
          });
      }
    });
 };  
 
 // Get the job location type list from table.
function getJobLocationPrefList(callback){  
      
    logger.debug("MasterControl - start job location option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbjoblocationpreftags").then(function(result)
         {            
           //If job location are available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var jobLocPrefJson = '{"jobLocation":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                jobLocPrefJson = jobLocPrefJson + '{"jobLocationId":'+result.rows[loopCnt].joblocationpreftagsid+',"jobLocationTags":"'+result.rows[loopCnt].joblocationpreftags+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  jobLocPrefJson = jobLocPrefJson + ',';
                }
              }
              jobLocPrefJson = jobLocPrefJson + ']}';
              callback(null, jobLocPrefJson);
           }
           else
           { 
             callback("Error : Job location is empty");
           }
         }).catch(function(err)
          {             
             console.log("Job location values not found" + err);
              logger.debug("MasterControl Job location : Job location list is empty");
              callback("Error : Job location is empty");
          });
      }
    });
 };  
 
// Get the Matri expected job type list from table.
function getMatriExpectedJobsList(callback){  
      
    logger.debug("MasterControl - start job location option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbmatriexpectedjobtags").then(function(result)
         {            
           //If Matri expected job are available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var matriExJobJson = '{"matriExpectedJob":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                matriExJobJson = matriExJobJson + '{"matriExpectedJobId":'+result.rows[loopCnt].matriexpectedjobtagsid+',"matriExpectedJobTag":"'+result.rows[loopCnt].matriexpectedjobtags+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  matriExJobJson = matriExJobJson + ',';
                }
              }
              matriExJobJson = matriExJobJson + ']}';
              callback(null, matriExJobJson);
           }
           else
           {         
             callback("Error : Matri expected job is empty");
           }
         }).catch(function(err)
          {             
             console.log("Matri expected job values not found" + err);
              logger.debug("MasterControl matri job : Matri expected job list is empty");
              callback("Error : Matri expected job is empty");
          });
      }
    });
 };  
 
 // Get the Matri expected location type list from table.
function getMatriExpectedLocationList(callback){  
      
    logger.debug("MasterControl - start matri expected location option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbmatriexpectedpreferedlocationtags").then(function(result)
         {            
           //If Matri expected location are available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var matriExLocJson = '{"matriExpectedPrefLocation":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                matriExLocJson = matriExLocJson + '{"matriExpectedPrefLocationId":'+result.rows[loopCnt].matriexpectedpreferedlocationtagsid+',"matriExpectedPrefLocationTag":"'+result.rows[loopCnt].matriexpectedpreferedlocationtags+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  matriExLocJson = matriExLocJson + ',';
                }
              }
              matriExLocJson = matriExLocJson + ']}';
              callback(null, matriExLocJson);
           }
           else
           {           
             callback("Error : Matri expected location is empty");
           }
         }).catch(function(err)
          {             
             console.log("Matri expected location values not found" + err);
              logger.debug("MasterControl matri location : Matri expected location list is empty");
              callback("Error : Matri expected location is empty");
          });
      }
    });
 }; 
 
 // Get the Matri expected qualification type list from table.
function getMatriExpectedQualificationList(callback){  
      
    logger.debug("MasterControl - start matri expected qualification option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbmatriexpectedqualificationtags").then(function(result)
         {            
           //If Matri expected qualification are available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var matriExQualiJson = '{"matriExpectedQualification":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                matriExQualiJson = matriExQualiJson + '{"matriExpectedQualificationId":'+result.rows[loopCnt].matriexpectedqualificationtagsid+',"matriExpectedQualificationTag":"'+result.rows[loopCnt].matriexpectedqualificationtags+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  matriExQualiJson = matriExQualiJson + ',';
                }
              }
              matriExQualiJson = matriExQualiJson + ']}';
              callback(null, matriExQualiJson);
           }
           else
           {             
             callback("Error : Matri expected qualification is empty");
           }
         }).catch(function(err)
          {             
             console.log("Matri expected qualification values not found" + err);
              logger.debug("MasterControl matri qualification : Matri expected qualification list is empty");
              callback("Error : Matri expected qualification is empty");
          });
      }
    });
 }; 
 
// Get the qualification type list from table.
function getQualificationList(callback){  
      
    logger.debug("MasterControl - start qualification option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbqualificationtags").then(function(result)
         {            
           //If qualification list is available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var qualiJson = '{"qualification":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                qualiJson = qualiJson + '{"qualificationId":'+result.rows[loopCnt].qualificationtagid+',"qualificationTag":"'+result.rows[loopCnt].qualificationtagname+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  qualiJson = qualiJson + ',';
                }
              }
              qualiJson = qualiJson + ']}';
              callback(null, qualiJson);
           }
           else
           {         
             callback("Error : Qualification list is empty");
           }
         }).catch(function(err)
          {             
             console.log("Qualification values not found" + err);
              logger.debug("MasterControl Qualification : Qualification list is empty");
              callback("Error : Qualification list is empty");
          });
      }
    });
 };
 
 // Get the Relation type list from table.
function getRelationList(callback){  
      
    logger.debug("MasterControl - start relation option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbrelationmaster WHERE status=1").then(function(result)
         {            
           //If relation list is available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var relationJson = '{"relation":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                relationJson = relationJson + '{"relationId":'+result.rows[loopCnt].relationid+',"relationName":"'+result.rows[loopCnt].relationname+'","relationType":"'+result.rows[loopCnt].relationtype+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  relationJson = relationJson + ',';
                }
              }
              relationJson = relationJson + ']}';
              callback(null, relationJson);
           }
           else
           {             
             callback("Error : Relation list is empty");
           }
         }).catch(function(err)
          {             
             console.log("Relation values not found" + err);
              logger.debug("MasterControl Relation : Relation list is empty");
              callback("Error : Relation list is empty");
          });
      }
    });
 };
 
 // Get the Skill type list from table.
function getSkillsList(callback){  
      
    logger.debug("MasterControl - start skill option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbskilltags").then(function(result)
         {            
           //If skill list is available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var skillJson = '{"skills":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                skillJson = skillJson + '{"skillId":'+result.rows[loopCnt].skilltagid+',"skillName":"'+result.rows[loopCnt].skillname+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  skillJson = skillJson + ',';
                }
              }
              skillJson = skillJson + ']}';
              callback(null, skillJson);
           }
           else
           {             
             callback("Error : Skill list is empty");
           }
         }).catch(function(err)
          {             
             console.log("Skill values not found" + err);
              logger.debug("MasterControl Skill : Skill list is empty");
              callback("Error : Skill list is empty");                
          });
      }
    });
 };
 
// Get the Timezone list from table.
function getTimezoneList(callback){  
      
    logger.debug("MasterControl - start timezone option list");    
   var pschemaName = conn.getDBSchema("");     
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("MasterControl - Error while connection PG" + err);
        logger.debug("MasterControl - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+pschemaName+".tbtimezone").then(function(result)
         {            
           //If Timezone list is available, then create a JSON structure for the list.
           if(result && result.rows && result.rows.length > 0)
           {              
              var timeJson = '{"timezones":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                timeJson = timeJson + '{"timezoneId":'+result.rows[loopCnt].timezoneid+',"timezoneName":"'+result.rows[loopCnt].timezone+'","timezoneMins":"'+result.rows[loopCnt].timezoneminutes+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  timeJson = timeJson + ',';
                }
              }
              timeJson = timeJson + ']}';
              callback(null, timeJson);
           }
           else
           {  
             callback("Error : Timezone list is empty");          
           }
         }).catch(function(err)
          {             
             console.log("Timezone values not found" + err);
              logger.debug("MasterControl Skill : Timezone list is empty");
              callback("Error : Timezone list is empty");
          });
      }
    });
 };