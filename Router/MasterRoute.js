var express = require('express');
var masterController = require('../Controller/MasterController.js');
var authController = require('../Controller/Auth.js');
var oauth2Controller = require('../Controller/Oauth2.js');
var logger = require("../logger");


var router = express.Router();

router.get('/',function(req,res){res.status(400), res.json({message:'Invalid url'})});


// Create endpoint handlers for /country
router.route('/countries')  
  .get(authController.isAuthenticated, masterController.getCountryList);

router.route('/floatsoption')  
  .get(authController.isAuthenticated, masterController.getFloatOptionList);
 
router.route('/accountsoption')  
  .get(authController.isAuthenticated, masterController.getAccountOptionList);
  
/*
  
router.route('/groupsoption')  
  .get(authController.isAuthenticated, masterController.getUsersList);
  
 router.route('/joblocationprefoption')   
  .get(authController.isAuthenticated, masterController.getUsersList);
  
 router.route('/matriexpectedjoboption')  
  .get(authController.isAuthenticated, masterController.getUsersList);
 
 router.route('/matriexpectedlocationoption')  
  .get(authController.isAuthenticated, masterController.getUsersList);

 router.route('/matriexpectedqualioption')  
  .get(authController.isAuthenticated, masterController.getUsersList);

 router.route('/qualificationoption')  
  .get(authController.isAuthenticated, masterController.getUsersList);

 router.route('/relationoption')  
  .get(authController.isAuthenticated, masterController.getUsersList);
  
 router.route('/skillsoption')  
  .get(authController.isAuthenticated, masterController.getUsersList);
  
 router.route('/timezoneoption')  
  .get(authController.isAuthenticated, masterController.getUsersList);
*/

module.exports = router;