//Default packages
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
//Custom packages
var userSecurity = require("../Modules/UserSecurityCollection.js");
var userDetails = require("../Modules/UserDetailsCollection.js");
var logger = require("../logger");
var conn = require("./Connection.js");

module.exports.getUsersList= function(req, res) {
    
    userDetails.find({userId:req.user.userId},function(err,user) {
        if(err)
        {
            res.send(err);
        }
        else
        {
            res.json(user);
        }
        
    });    
};