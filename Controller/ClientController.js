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
  client.id = req.body.userid.substr(0,15);
  client.secret = req.body.secret;
  client.userId = req.body.userid;
  var schemaName = conn.getDBSchema(client.name);

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
            clientConn.query('INSERT INTO '+schemaName+'.tbclient (name, id, secret, userid) VALUES ($1,$2,$3,$4) RETURNING clientid', 
              [client.name, client.id, client.secret, client.userId], function(err, result){
                if(err)
                {
                  console.log("ClientSave - Error while saving Client" + err);
                  logger.debug("ClientSave - Error while saving Client" + err);
                  res.json({ message: 'Error while saving Client'});
                }
                else
                {
                  console.log("Client inserted successfully for " + result.rows[0].clientid);
                  res.json({ message: 'Client added !', data: client });
                }
                clientConn.end();
                
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
};

// Create endpoint /api/clients for GET
exports.getClients = function(req, res) {
  var schemaName = conn.getDBSchema(req.username);
  // Use the Client model to find all clients
  conn.getPGConnection(function(err, clientConn)
  {
    if(err)
    {
      console.log("ClientSave - Error while saving Client" + err);
      logger.debug("ClientSave - Error while saving Client" + err);
    }
    else
    {
      clientConn.queryAsync("SELECT userid from "+schemaName+".tbclient WHERE userid = $1", [req.userid]).then(function(result)
      {
          if(result && result.rows && result.rows.length > 0)
          {
            var clientData = "clientid = " + result.rows[0].clientid + " name = " + result.rows[0].name +" id = "+ result.rows[0].id + " secret = " +  result.rows[0].secret + " userid = " + result.rows[0].userid; 
            res.json(clientData);
          }
          else
          {
            logger.debug("ClientGet - Error while getting Client");
            console.log("ClientGet - Error while getting Client");            
          }
      });
    }
  });
};

