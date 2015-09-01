// Load required packages
var oauth2orize = require('oauth2orize')
var userSecurity = require("../Modules/UserSecurityCollection.js");
var tokenMod = require('../Modules/Token.js'); 
var codeMod = require('../Modules/Code.js');
var clientMod = require('../Modules/Client.js');
var logger = require("../logger");
var conn = require("./Connection.js");

// Create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization function
server.serializeClient(function(client, callback) 
{
  return callback(null, client.id);
});

// Register deserialization function
server.deserializeClient(function(id, callback) 
{  
  var schemaName = conn.getDBSchema("");
  // Use the Client model to find all clients
  conn.getPGConnection(function(err, clientConn)
  {
    if(err)
    {
      console.log("Auth2 - Error while deserializing Client" + err);
      logger.debug("Auth2 - Error while deserializing Client" + err);
      return callback(err);
    }
    else
    {
      clientConn.queryAsync("SELECT * from "+schemaName+".tbclient WHERE id = $1", [id]).then(function(result)
      {
          if(result && result.rows && result.rows.length > 0)
          {
            var client = new clientMod();
            client.name = result.rows[0].name;
            client.id = result.rows[0].id;
            client.secret = result.rows[0].secret;
            client.userId = result.rows[0].userid; 
            return callback(null, client);
          }
          else
          {
            logger.debug("Auth2 - Error while getting Client");
            console.log("Auth2 - Error while getting Client");            
          }
      });
    }
  });
});

// Register authorization code grant type
server.grant(oauth2orize.grant.code(function(client, redirectUri, user, ares, callback) {
  // Create a new authorization code
  var code = new codeMod({
    value: uid(16),
    clientId: client.id,
    redirectUri: redirectUri,
    userId: client.userId
  });
  logger.debug("Auth2 Grant - Save code start");
  // Save the auth code and check for errors
  
     var schemaName =  conn.getDBSchema(""); 
     conn.getPGConnection(function(err, clientConn)
      {    
        if(err)
        {
          console.log("ClientSave - Error while connection PG" + err);
          logger.debug("ClientSave - Error while connection PG" + err);
        }
        else
        {
          clientConn.queryAsync("INSERT INTO "+schemaName+".tbcode (value, redirecturi, userid, clientid) VALUES ($1,$2,$3,$4) RETURNING clientid", [code.value, code.redirectUri, code.userId, code.clientId]).then(function(result)
          {
            if(result && result.rows && result.rows.length > 0)
            {
              callback(null, code.value);
            }
            else
            {
              logger.debug("Auth2 Grant - Error while saving code");
              return callback({});
            }
          }).catch(function(err){
            logger.debug("Auth2 Grant - Error while saving code" + err); 
            return callback(err);
          });
        }
      }); 
}));

// Exchange authorization codes for access tokens
server.exchange(oauth2orize.exchange.code(function(client, code, redirectUri, callback) 
{  
   var schemaName =  conn.getDBSchema(""); 
   conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("ClientSave - Error while connection PG" + err);
        logger.debug("ClientSave - Error while connection PG" + err);
      }
      else
      {        
        clientConn.queryAsync("SELECT * from "+schemaName+".tbcode WHERE userid = $1", [client.userId]).then(function(result)
         {
           
            if(result && result.rows && result.rows.length > 0)
            {
              if(client.userId !== result.rows[0].userid)
              {
                logger.debug("Auth2 Exch - Error in id and code mismatch");
          		  return callback(null, false);   
              }
              if(redirectUri !== result.rows[0].redirecturi)
              {
                logger.debug("Auth2 Exch - Error in redirectUri mismatch");
          		  return callback(null, false); 
              }
            }
            else
            {
              logger.debug("Auth2 Exch - Error in code undefined");
          		return callback(null, false); 
            }  
            // Delete auth code now that it has been used
            clientConn.queryAsync("DELETE FROM "+schemaName+".tbcode WHERE userid = $1 RETURNING userid", [client.userId]).then(function(result){
              if(result && result.rows && result.rows.length > 0)
              {
                logger.debug("Auth2 Exch - Code deleted successfully");		            
              }
              else
              {
                logger.debug("Auth2 Exch - Error while removing code ");
		            return callback({}); 
              }
              
              // Create a new access token
              var token = new tokenMod({
                value: uid(21),
                clientId: client.id,
                userId: client.userId
              });
              logger.debug("Auth2 Exch - Token Save start ");
              // Save the access token and check for errors
              clientConn.queryAsync("INSERT INTO "+schemaName+".tbtoken (value, userid, clientid) VALUES ($1,$2,$3) RETURNING tokenid", [token.value, token.userId, token.clientId]).then(function(result){
              if(result && result.rows && result.rows.length > 0)
              {
                logger.debug("Auth2 Exch - Token inserted successfully for clientid = " + client.id);
                 callback(null, token);		            
              }
              else
              {
                logger.debug("Auth2 Exch - Error while inserting token for clientid = " + client.id);
		            return callback({}); 
              }
              
            }).catch(function(err){
                logger.debug("Auth2 Exch - Error while adding token" + err);
                return callback(err); 
              });         
            
         }).catch(function(err){
           logger.debug("Auth2 Exch - Error while find code" + err);
		       return callback(err); 
         });
      });
    }
  });
}));

// User authorization endpoint
exports.authorization = [
  server.authorization(function(clientId, redirectUri, callback) {


    var schemaName =  conn.getDBSchema(""); 
    conn.getPGConnection(function(err, clientConn)
    {    
      if(err)
      {
        console.log("ClientSave - Error while connection PG" + err);
        logger.debug("ClientSave - Error while connection PG" + err);
      }
      else
      {        
        clientConn.queryAsync("SELECT * from "+schemaName+".tbclient WHERE id = $1", [clientId]).then(function(result)
         {           
            if(result && result.rows && result.rows.length > 0)
            {
               var client = new clientMod();
              // Set the client properties that came from the POST data
              client.name = result.rows[0].name;
              client.id = result.rows[0].id;
              client.secret = result.rows[0].secret;
              client.userId = result.rows[0].userid;
              return callback(null, client, redirectUri);
            }
            else
            {
              var error = new Error("Error while getting client for id = " + clientId);
              return callback(error); 
            }
         });
      }
    }); 
  }),
  function(req, res)
  {
    res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
  }
];

// User decision endpoint
exports.decision = [
  server.decision()
];

// Application client token exchange endpoint
exports.token = [
  server.token(),
  server.errorHandler()
];

function uid (len) 
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