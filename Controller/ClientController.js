// Load required packages
var Client = require('../Modules/Client.js');
var logger = require("../logger");
var conn = require("./Connection.js");

// Create endpoint /api/client for POST
exports.postClients = function(req, res) {
  // Create a new instance of the Client model
  var client = new Client();

  // Set the client properties that came from the POST data
  client.name = req.body.name;
  client.id = req.body.id;
  client.secret = req.body.secret;
  client.userId = req.user._id;

  logger.debug("ClientSave - Save Started");
  conn.getPGConnection(function(err, clientConn)
  {
    if(err)
    {
      console.log("ClientSave - Error while saving Client" + err);
      logger.debug("ClientSave - Error while saving Client" + err);
    }
    else
    {
      try
      {
          clientConn.connect(function(err){
            if(err)
            {
              console.log("ClientSave - Error while saving Client" + err);
              logger.debug("ClientSave - Error while saving Client" + err);
            }
            else
            {
              clientConn.query('INSERT INTO tbclient (name, id, secret, userid) VALUES ($1,$2,$3,$4) RETURNING clientid', 
                [client.name, client.id, client.secret, client.userId], function(err, result){
                  if(err)
                  {
                    console.log("ClientSave - Error while saving Client" + err);
                    logger.debug("ClientSave - Error while saving Client" + err);
                  }
                  else
                  {
                    console.log("Client inserted successfully for " + result.rows[0].clientid);
                  }
                  clientConn.end();
                });
            }
          });
        }
        catch(err)
        {
          clientConn.end();
          console.log("ClientSave - Error while saving Client" + err);
          logger.debug("ClientSave - Error while saving Client" + err);
        }
    }
      
  });
  
  
  // Save the client and check for errors
  client.save(function(err) 
    {
    if (err)
    {
      logger.debug("ClientSave - Error while saving Client");
      res.send(err);
    }

    res.json({ message: 'Client added !', data: client });
  });
};

// Create endpoint /api/clients for GET
exports.getClients = function(req, res) {
  // Use the Client model to find all clients
  Client.find({ userId: req.user._id }, function(err, clients) {
    if (err)
    {
      logger.debug("ClientGet - Error while getting Client");
      res.send(err);
    }

    res.json(clients);
  });
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