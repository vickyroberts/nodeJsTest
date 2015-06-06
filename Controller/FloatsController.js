var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var floatsDetails = require("../Modules/FloatsCollection.js");
var logger = require("../logger");
var conn = require("./Connection.js");

module.exports.getFloatDetails= function(req, res) {
    
    floatsDetails.find(function(err,user) {
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