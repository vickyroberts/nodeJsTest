var express = require('express');
var userController = require('../Controller/UserController.js');
var emailController = require('../Controller/EmailController.js');
var clientController = require('../Controller/ClientController.js');
var authController = require('../Controller/Auth.js');
var oauth2Controller = require('../Controller/Oauth2.js');
var logger = require("../logger");


var router = express.Router();

router.get('/',function(req,res){res.status(400), res.json({message:'Invalid url'})});

//router.get('/users',userController.getUsersList);
// Create endpoint handlers for /beers
router.route('/users')  
  .get(authController.isAuthenticated, userController.getUsersList);
  
//Register user details.
router.post('/registerUser', userController.postUserRegister);  

//Check if username of page name already exists.
router.post('/checkRecordAvailable', userController.checkUserorEmailAvailable);

//Login user
router.route('/loginUser')
    .post(authController.isAuthenticated, userController.postUserLogin);

//Update password of existing user
router.route('/updatepassword')
    .post(authController.isAuthenticated, userController.changePasswordRegisterPG);    

//Get registered user's details
router.route('/getuserinfo')
    .post(authController.isAuthenticated, userController.getUserDetails);    
    
//Update registered user's details
router.route('/updateuserinfo')
    .post(authController.isAuthenticated, userController.updateUserDetails);
    
//Update registered user's mobile no.
router.route('/updatemobileno')
    .post(authController.isAuthenticated, userController.updateMobileNumber);   
    
//Update registered user's work information.
router.route('/updateworkinfo')
    .post(authController.isAuthenticated, userController.updateWorkDetails);  
    
//Update registered user's education details
router.route('/updateeducationinfo')
    .post(authController.isAuthenticated, userController.updateEducationDetails);
    
//Enable or disable user - Status 0 for inactive user added under tree only, 1 for enabled user, 2 for rip user and 3 for disabled. 
router.route('/enableuser')
    .post(authController.isAuthenticated, userController.updateUserStatus);

//Send email to the user    
router.route('/sendemail')
    .post(authController.isAuthenticated, emailController.sendEmailAlert);
   
    
//Register user details.
router.post('/uploadpicture', userController.profilePicUpload); 

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
	