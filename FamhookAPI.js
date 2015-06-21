var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var userRoutes = require('./Router/UserRoutes.js');
var floatRoutes = require('./Router/FloatRoute.js');
var passport = require('passport');
var session = require('express-session');
var logger = require("./logger");
var ejs = require('ejs');

var app = express();

logger.debug("Application initiating...");

// Set view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
// Use the passport package in our application
app.use(passport.initialize());
// Use express session support since OAuth2orize requires it
app.use(session({
  secret: 'Super Secret Session Key',
  saveUninitialized: true,
  resave: true
}));


app.use('/api',userRoutes);
app.use('/api',floatRoutes);

var port = 3000;

app.listen(port);
logger.debug("Application started at port " + port + ".. !!!");
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");

  

  
  
 