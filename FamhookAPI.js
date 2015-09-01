var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var busboy = require('connect-busboy');
var userRoutes = require('./Router/UserRoutes.js');
var floatRoutes = require('./Router/FloatRoute.js');
var relationRoutes = require('./Router/RelationRoute.js');
var masterRoutes = require('./Router/MasterRoute.js');
var passport = require('passport');
var session = require('express-session');
var logger = require("./logger");
var ejs = require('ejs');

var app = express();

logger.debug("Application initiating...");

app.use(busboy());

//process.on('uncaughtException', function (err) {
//  console.log('Caught exception: ' + err);
//});

// Set view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
// Use the passport package in our application
app.use(passport.initialize());
// Use express session support since OAuth2orize requires it
var date = new Date();
var appendToExternalId = date.getDate()+"v"+date.getMonth()+"r"+date.getFullYear();
app.use(session({  
  secret: appendToExternalId + 'fverh',
  saveUninitialized: true,
  resave: false
}));


app.use('/api',userRoutes);
app.use('/api/floats/',floatRoutes);
app.use('/api/relations/',relationRoutes);
app.use('/api/masters/',masterRoutes);

var port = 3000;

app.listen(port);
logger.debug("Application started at port " + port + ".. !!!");
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");


//NEED TO UN-COMMENT IN PRODUCTION
process.on('uncaughtException', function (err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  logger.debug("UncaughtException :: " + err);
  process.setMaxListeners(0);
  process.exit(1);
});

  
  
 