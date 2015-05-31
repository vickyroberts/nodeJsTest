var express = require('express');
var userController = require('../Controller/UserController.js');

var router = express.Router();

router.get('/',function(req,res){res.json({message:'Successfully in the get function...!!'})});

router.get('/item',userController.item_all);

module.exports = router;
