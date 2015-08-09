// Load required packages
var passport = require('passport');
var basicStrategy = require('passport-http').BasicStrategy;
var bearerStrategy = require('passport-http-bearer').Strategy;
var bcrypt = require('bcrypt-nodejs');
var token = require('../Modules/Token.js'); 
var user = require('../Modules/UserSecurityCollection.js');
var client = require('../Modules/Client.js');
var logger = require("../logger");
var conn = require("./Connection.js");

passport.use('basic', new basicStrategy(
  function(username, password, callback) {
   
   var schemaName =  conn.getDBSchema(username); 
   conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("ClientSave - Error while connection PG" + err);
        logger.debug("ClientSave - Error while connection PG" + err);
      }
      else
      {
        clientConn.queryAsync("SELECT * from "+schemaName+".tbusersecurity WHERE username = $1", [username]).then(function(result)
         {
           
           if(result && result.rows && result.rows.length > 0)
           {
             console.log("Username found");            
            
               // Make sure the password is correct
              verifyPassword(password, result.rows[0].password, function(err, isMatch) {
                if (err) { 
                  console.log("Password not found" + err);
                  logger.debug("Auth Passport - Password not found");
                  return callback(err);
                }else{console.log("Password found");}
        
                // Password did not match
                if (!isMatch) 
                {
                  logger.debug("Auth Passport - Password not found"); 
                  return callback(null, false); 
                }        
                // Success
                return callback(null, user);
              });
           }
           else
           {
              console.log("Username not found" + err);
              logger.debug("Auth Passport - Username not found = " + username);
              return callback({message:"No results returned"});  
           }
           clientConn.end();
           
         }).catch(function(err){
           console.log("Username not found" + err);
          logger.debug("Auth Passport - Username not found = " + username);
          clientConn.end();
          return callback(err);            
         });
      }
    });
  }
));

passport.use('client-basic', new basicStrategy(
  function(username, password, callback) 
  {
    
    var schemaName =  conn.getDBSchema(username); 
     conn.getPGConnection(function(err, clientConn)
      {    
        if(err)
        {
          console.log("ClientSave - Error while connection PG" + err);
          logger.debug("ClientSave - Error while connection PG" + err);
        }
        else
        {
          clientConn.queryAsync("SELECT us.userid,us.username,us.extid,cl.clientid,cl.name,cl.id,cl.secret from "+schemaName+".tbusersecurity us left join "+schemaName+".tbclient cl on us.userid = cl.userid where us.username = $1", [username]).then(function(result)
           {
             
             if(result && result.rows && result.rows.length > 0)
             {
                client.userId = result.rows[0].userid;
                client.secret = result.rows[0].secret;
                client.id = result.rows[0].id;
                client.name = result.rows[0].name;
                // Success
                return callback(null, client);
             }
             else
             {
                console.log('Error while passport client-basic.');
                logger.debug('Auth - Error while passport client-basic.');
                return callback(err);                 
             }
             clientConn.end();
           }).catch(function(err)
           {
             console.log('Error while passport client-basic.' + err);
             logger.debug('Auth - Error while passport client-basic.' + err);
             return callback(err);                 
           });
        }
      });
  }
));

passport.use(new bearerStrategy({passReqToCallback:true},
  function(req, accessToken, callback) 
  {   
    var loggedUsername = (req.body.username) ? req.body.username : req.session.username;
    var schemaName =  conn.getDBSchema(loggedUsername); 
     conn.getPGConnection(function(err, clientConn)
      {    
        if(err)
        {
          console.log("ClientSave - Error while connection PG" + err);
          logger.debug("ClientSave - Error while connection PG" + err);
        }
        else
        {
          clientConn.queryAsync("SELECT us.userid,us.username,us.password,us.extid,tk.tokenid,tk.value,tk.userid,tk.clientid from "+schemaName+".tbusersecurity us left join "+schemaName+".tbtoken tk on us.userid = tk.userid where us.username = $1 AND tk.value = $2", [loggedUsername, accessToken]).then(function(result)
           {
             console.log("TODO ::  IF  hours is greater than 24 then refresh token or expire");
             if(result && result.rows && result.rows.length > 0)
             {
                  var userObj = new user();
                  userObj.userId = result.rows.userid;
                  userObj.userName = result.rows.username;
                  userObj.password = result.rows.password;                  
                  // Simple example with no scope
                  callback(null, userObj, { scope: '*' });
             }
             else
             {
                console.log('Error while passport client-basic.');
                logger.debug('Auth - Error while passport client-basic.');
                return callback(null, false);                 
             }
             clientConn.end();
           }).catch(function(err)
           {
             console.log('Error while passport client-basic.' + err);
             logger.debug('Auth - Error while passport client-basic.' + err);
             return callback(err);                 
           });
        }
      });
  }
));

function verifyPassword(password, dbpassword, cb) 
{
  logger.debug("Verify Password");
  bcrypt.compare(password, dbpassword, function(err, isMatch) 
   {
    if (err) 
	{ 
		return cb(err);
		logger.debug("Verify Password failed for password - " + password);
	}
    cb(null, isMatch);
  });
}


//Check the difference between 2 datetimes and return the difference in hours.
function GetDateTimeDifference(maxDate, minDate)
{
  
  
}

exports.isClientAuthenticated = passport.authenticate('client-basic', { session : false });
exports.isBearerAuthenticated = passport.authenticate('bearer', { session: false });
//exports.isAuthenticated = passport.authenticate('basic', { session : false });
exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], { session : false });