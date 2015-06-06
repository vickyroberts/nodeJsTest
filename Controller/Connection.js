var mongoose = require('mongoose');
var logger = require("../logger");

//mongo db connection url
var mongoUri = 'mongodb://localhost:27017/famhook';
//mongo db connection options
var options = {
  db: { native_parser: true },
  server: { poolSize: 5 },
  user: "admin",
  pass: "admin"
};

//console.log("In connection file");
//console.log("STATE = " + mongoose.connection.readyState);
mongoose.connect(mongoUri, options, function(err){
		
		if(err)
		{
			console.log("Error while mongo connection" + err);
			logger.debug("Error while connecting to mongo" + err);
		}
		else
		{
            console.log("Connection successfull");
        }
});