var express = require('express');

//Validate Password
exports.ValidatePassword = function(password)
{
  // at least one number, one lowercase and one uppercase letter
  // at least six characters
  var re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,10}$/;
  return re.test(password);
};

//Validate email
exports.ValidateEmail = function(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
};

exports.ValidateMobileNumber = function(mobno) {
  if(mobno.match(/^[1-9]{1}[0-9]{11}$/))
    {
      return true;
    }    
    return false;
};
//Check if the date is valid and in correct format.
exports.ValidateDateOfBirth = function(dob)
{
  var formattedDate = null;
  try
  {
    var date = new Date();  	
    var splitDate = dob.split('-');
    if(splitDate.length == 3)
    {
      if(splitDate[0] < 0 && splitDate[0] > 12)
      {
        formattedDate = null;
      }
      else if(splitDate[1] < 0 && splitDate[1] > 31)
      {
        formattedDate = null;
      }
      else if(splitDate[2] < 1920 && splitDate[2] > (date.getFullYear()-1))
      {
        formattedDate = null;
      }
      else
      {
        formattedDate = splitDate[2]+"-"+splitDate[0]+"-"+splitDate[1];
        formattedDate = formattedDate + " 00:00:00";
      }
    }
    else
    {
      formattedDate = null;
    }
  }
  catch(err){formattedDate = null;}
  return formattedDate;
};

//Verify the password with hash values.
//Parameters are plain text pass, hash values array and callback.
exports.VerifyPassword = function(count, currentPwd, arrPasswords, isPasswordMatch, callback)
{ 
    //Recursive code for completing the looping in callback mechanism.
    try
    {
      bcrypt.compare(currentPwd, arrPasswords[count], function(err, isMatch) 
       {
        if (err) 
    	  {     		
    		  logger.debug("Verify password failed");
          callback(err);
    	  }
        
        //check if the last 4 password matches the new password. The 4 is harcoded.
        //If we have to increase last 4 option to "n" number of option, then change the below 4 to "n".
        isPasswordMatch = isMatch;
        if(count == 4 || count == arrPasswords.length-1 || isPasswordMatch)
        {
          callback(null, isPasswordMatch);
        }      
        else
        {          
           VerifyPassword(count+1, currentPwd, arrPasswords, isPasswordMatch, callback);
        }
      });
    }
    catch(err){
      callback(err, false);
    }       
};

//This function creates a hash of input values required for Bcrypt.
exports.HashKeywords = function(input)
{		
	//Password changed so we need to hash it  
	  bcrypt.genSalt(5, function(err, salt) 
     {
	       if (err) 
         {
           console.log("error while creating hash for "+ input);
         };
	
	       hashedVal = bcrypt.hash(input, salt, null, function(err, hash) 
    	    {
        	    if (err)
        	    { return "";}
    	    
    	        var hashedValue = hash;
    		      return hashedValue;
	       });
	   });
};

exports.generateRandomUId = function(len) 
{
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) 
  {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

function getRandomInt(min, max) 
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}