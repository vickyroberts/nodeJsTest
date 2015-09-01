var express = require('express');
var userController = require('../Controller/UserController.js');
var relationController = require('../Controller/RelationController.js');
var authController = require('../Controller/Auth.js');
var oauth2Controller = require('../Controller/Oauth2.js');
var logger = require("../logger");


var router = express.Router();

router.get('/',function(req,res){res.status(400), res.json({message:'Invalid url'})});

//Add the tree name
router.post('/newTree', relationController.addNewTree);

//Add the tree name
router.post('/newMember', relationController.postNewMemberRegister);

/*//Login user
router.route('/newTreeAuth')
    .post(authController.isAuthenticated, relationController.addNewTree);
*/

module.exports = router;