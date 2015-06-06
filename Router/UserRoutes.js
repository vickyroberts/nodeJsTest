var express = require('express');
var userController = require('../Controller/UserController.js');
var authController = require('../Controller/Auth.js');

var router = express.Router();

router.get('/',function(req,res){res.json({message:'Successfully in the get function...!!'})});

//router.get('/users',userController.getUsersList);
// Create endpoint handlers for /beers
router.route('/users')  
  .get(authController.isAuthenticated, userController.getUsersList);

module.exports = router;
	