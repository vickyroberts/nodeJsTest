var express = require('express');
var userController = require('../Controller/UserController.js');
var clientController = require('../Controller/ClientController.js');
var authController = require('../Controller/Auth.js');
var oauth2Controller = require('../Controller/Oauth2.js');
var logger = require("../logger");


var router = express.Router();

router.get('/',function(req,res){res.json({message:'Successfully in the get function...!!'})});

//router.get('/users',userController.getUsersList);
// Create endpoint handlers for /beers
router.route('/users')  
  .get(authController.isAuthenticated, userController.getUsersList);
  
router.route('/loginUser')
    .post(authController.isAuthenticated, userController.postUserLogin);
    
router.post('/registerUser', userController.postUserRegister);     

router.route('/clients')
    .post(authController.isAuthenticated, clientController.postClients)
    .get(authController.isAuthenticated, clientController.getClients);
    
// Create endpoint handlers for oauth2 authorize
router.route('/oauth2/authorize')
  .get(authController.isAuthenticated, oauth2Controller.authorization)
  .post(authController.isAuthenticated, oauth2Controller.decision);

// Create endpoint handlers for oauth2 token
router.route('/oauth2/token')
  .post(authController.isClientAuthenticated, oauth2Controller.token);

module.exports = router;
	