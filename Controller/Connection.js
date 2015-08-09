var mongoose = require('mongoose');
var pg = require('pg');
var logger = require("../logger");

var pgConString = "postgres://famhook:famhook21@localhost:5444/famhook";

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

exports.getPGConnection = function(callback)
{
	try
	{
		var client = new pg.Client(pgConString);
		client.connect(function(err){
			if(err)
			{
				console.log("Error while PG connection" + err);
				logger.debug("Error while connecting to PG" + err);
				callback(err);
			}
			else
			{
				callback(null,client);
			}
		});
	}
	catch(err)
	{
		console.log("Error while PG connection" + err);
		logger.debug("Error while connecting to PG" + err);
	}
};

exports.rollback = function(client) 
{
  //terminating a client connection will
  //automatically rollback any uncommitted transactions
  //so while it's not technically mandatory to call
  //ROLLBACK it is cleaner and more correct
  client.query('ROLLBACK', function() {
    client.end();
  });
};

exports.getDBSchema = function(username)
{
	return "famhook21";	
};