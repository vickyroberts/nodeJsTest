//Default packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var promise = require("bluebird");
var pg = require('pg');
//Custom packages
var masterCol = require("../Modules/MasterCollection.js");
var logger = require("../logger");
var conn = require("./Connection.js");

promise.promisifyAll(mongoose);
promise.promisifyAll(pg);

// Get the country list from country table.
exports.getCountryList = function(req, res) {  
      
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
              res.status(200);
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
               res.json(JSON.parse(countryJson));
           }
           else
           {             
             res.status(200);
              res.json({message:"Error : Country list is empty"});  
           }
         }).catch(function(err)
          {
             res.status(400);
             console.log("Value not found" + err);
              logger.debug("MasterControl country : Country list is empty");
              res.json({message:"Error : Country list is empty"});  
          });
      }
    });
 };  
 
 // Get the float type list from table.
exports.getFloatOptionList = function(req, res) {  
      
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
              res.status(200);
              var floatJson = '{"floatOption":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                floatJson = floatJson + '{"floatoptionid":'+result.rows[loopCnt].floattypeid+',"floatoptionname":"'+result.rows[loopCnt].floattypename+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  floatJson = floatJson + ',';
                }
              }
              floatJson = floatJson + ']}';                           
               res.json(JSON.parse(floatJson));
           }
           else
           {             
             res.status(200);
              res.json({message:"Error : Float option list is empty"});  
           }
         }).catch(function(err)
          {
             res.status(400);
             console.log("Value not found" + err);
              logger.debug("MasterControl floatoption : Country list is empty");
              res.json({message:"Error : Float option is empty"});  
          });
      }
    });
 };  
 
  // Get the Account type list from table.
exports.getAccountOptionList = function(req, res) {  
      
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
              res.status(200);
              var accountJson = '{"accountOption":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                accountJson = accountJson + '{"accountoptionid":'+result.rows[loopCnt].accounttypeid+',"accountoptionname":"'+result.rows[loopCnt].accounttypename+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  accountJson = accountJson + ',';
                }
              }
              accountJson = accountJson + ']}';                           
               res.json(JSON.parse(accountJson));
           }
           else
           {             
             res.status(200);
              res.json({message:"Error : Account option list is empty"});  
           }
         }).catch(function(err)
          {
             res.status(400);
             console.log("Account Value not found" + err);
              logger.debug("MasterControl Account : Country list is empty");
              res.json({message:"Error : Account option is empty"});  
          });
      }
    });
 };  
 
// Get the Group type list from table.
exports.getGroupOptionList = function(req, res) {  
      
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
              res.status(200);
              var groupJson = '{"groupOption":[';
              for(var loopCnt=0;loopCnt<result.rows.length;loopCnt++)
              {                
                groupJson = groupJson + '{"groupoptionid":'+result.rows[loopCnt].grouptypeid+',"groupoptionname":"'+result.rows[loopCnt].grouptypename+'"}';
                if(loopCnt < (result.rows.length - 1))
                {
                  groupJson = groupJson + ',';
                }
              }
              groupJson = groupJson + ']}';                           
               res.json(JSON.parse(groupJson));
           }
           else
           {             
             res.status(200);
              res.json({message:"Error : Group option list is empty"});  
           }
         }).catch(function(err)
          {
             res.status(400);
             console.log("Group Value not found" + err);
              logger.debug("MasterControl Group : Group list is empty");
              res.json({message:"Error : Group option is empty"});  
          });
      }
    });
 };  