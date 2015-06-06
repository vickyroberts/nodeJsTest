var express = require('express');
var floatController = require('../Controller/FloatsController.js');

var router = express.Router();

router.get('/',function(req,res){res.json({message:'Successfully in the get function...!!'});});

router.get('/floats',floatController.getFloatDetails);

module.exports = router;
