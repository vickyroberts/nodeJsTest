var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

module.exports.item_all = function(req, res) {
    res.json([{itemName:'diamond',quantity:10,price:'Rs 50000'}]);
};