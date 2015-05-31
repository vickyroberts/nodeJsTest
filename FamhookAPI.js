var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var userRoutes = require('./Router/UserRoutes.js');

var app = express();

app.use(bodyParser.urlencoded({extended:true}));

app.use('/api',userRoutes);

var port = 3000;

app.listen(port);
console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");