var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var userRoutes = require('./Router/UserRoutes.js');
var floatRoutes = require('./Router/FloatRoute.js');
var passport = require('passport');

var app = express();

app.use(bodyParser.urlencoded({extended:true}));
// Use the passport package in our application
app.use(passport.initialize());

app.use('/api',userRoutes);
app.use('/api',floatRoutes);

var port = 3000;

app.listen(port);
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");

  

  
  
 