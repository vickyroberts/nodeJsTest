// Load required packages
var passport = require('passport');
var basicStrategy = require('passport-http').BasicStrategy;
var bearerStrategy = require('passport-http-bearer').Strategy;
var token = require('../Modules/Token.js'); 
var user = require('../Modules/UserSecurityCollection.js');
var client = require('../Modules/Client.js');
var logger = require("../logger");

passport.use('basic', new basicStrategy(
  function(username, password, callback) {
    user.findOne({ userName: username }, function (err, user) {
      if (err) 
      { 
        console.log("Username not found" + err);
        logger.debug("Auth Passport - Username not found = " + username);
        return callback(err); 
      }
      else
      {
        console.log("Username found");
      }

      // No user found with that username
      if (!user) 
      { 
        console.log("Username error found");
        logger.debug("Auth Passport - Username error found = " + username);
        return callback(null, false); 
      }

      // Make sure the password is correct
      user.verifyPassword(password, function(err, isMatch) {
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
    });
  }
));

passport.use('client-basic', new basicStrategy(
  function(username, password, callback) {
    client.findOne({ id: username }, function (err, client) {
      if (err) 
      { 
        Console.log('Error while passport client-basic.' + err);
        return callback(err);                 
      }

      // No client found with that id or bad password
      if (!client || client.secret !== password) 
      {
        Console.log('Client-basic - No client found with that id or bad password' + err); 
        return callback(null, false); 
      }

      // Success
      return callback(null, client);
    });
  }
));

passport.use(new bearerStrategy({passReqToCallback:true},
  function(req, accessToken, callback) 
  {    
    token.findOne({value: accessToken }, function (err, token) {
      if (err) 
      { 
        return callback(err); 
      }

      // No token found
      if (!token) { return callback(null, false); }
      var userName = req.body.username;
      //Check if the id and username are same for the token. If either of the value is mismatch
      //then throw an error.
      user.findOne({ _id: token.userId, userName: userName }, function (err, userObj) 
      {      
        if (err) 
        { 
          return callback(err); 
        }
                
        var tokenCreated = new Date(token.createdDate);
        var currentDate = new Date();        
        var diffMs = (currentDate-tokenCreated); 
        var diffDays = Math.round(diffMs / 86400000);
        var diffHrs = Math.round((diffMs % 86400000) / 3600000);
        var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);        
        console.log("TODO ::  IF  hours is greater than 24 then refresh token or expire" + diffMins);
           

        // No user found
        if (!userObj) 
        { 
          return callback(null, false); 
        }

        // Simple example with no scope
        callback(null, userObj, { scope: '*' });
      });
    });
  }
));

//Check the difference between 2 datetimes and return the difference in hours.
function GetDateTimeDifference(maxDate, minDate)
{
  
  
}

exports.isClientAuthenticated = passport.authenticate('client-basic', { session : false });
exports.isBearerAuthenticated = passport.authenticate('bearer', { session: false });
//exports.isAuthenticated = passport.authenticate('basic', { session : false });
exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], { session : false });