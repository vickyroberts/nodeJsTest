// Load required packages
var Client = require('../Modules/Client.js');
var logger = require("../logger");

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