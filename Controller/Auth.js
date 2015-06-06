// Load required packages
var passport = require('passport');
var basicStrategy = require('passport-http').BasicStrategy;
var user = require('../Modules/UserSecurityCollection.js');

passport.use(new basicStrategy(
  function(username, password, callback) {
    user.findOne({ userName: username }, function (err, user) {
      if (err) 
      { 
        console.log("Username not found" + err);
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
        return callback(null, false); 
      }

      // Make sure the password is correct
      user.verifyPassword(password, function(err, isMatch) {
        if (err) { 
          console.log("Password not found" + err);
          return callback(err);
        }else{console.log("Password found");}

        // Password did not match
        if (!isMatch) { return callback(null, false); }

        // Success
        return callback(null, user);
      });
    });
  }
));

exports.isAuthenticated = passport.authenticate('basic', { session : false });