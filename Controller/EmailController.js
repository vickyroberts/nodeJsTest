var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var promise = require("bluebird");
var pg = require('pg');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
//Custom packages
var masterCol = require("../Modules/MasterCollection.js");
var logger = require("../logger");
var propertyFile = require("../PropertiesValue.js");
var conn = require("./Connection.js");

promise.promisifyAll(mongoose);
promise.promisifyAll(pg);
var mailSettings = {host:propertyFile.smtpIp, port:propertyFile.smtpPort, auth:{user:propertyFile.smtpUser,pass:propertyFile.smtpPass}};

exports.sendEmailAlert = function(req, res)
{
	if(req && req.body.emailto && req.body.emailfrom && req.body.mailfor)
	{
		try
		{
			var transporter = nodemailer.createTransport(smtpTransport(mailSettings));
			var emailOption = generateMailOptions(req.body.emailfrom, req.body.emailto, req.body.mailfor);		
			transporter.sendMail(emailOption, function(err, response){
				if(err)
				{					
					console.log("EmailControl - Error while sending email " + err);
      				logger.debug("EmailControl - Error while sending email " + err);
					res.send({message: "Error : Error while sending an email"});
				}
				else
				{
					console.log('Email sent');
					res.send({message: "Email sent successfully"});
				}
			});
		}
		catch(err)
		{
			console.log("EmailControl - Error while sending email " + err);
      		logger.debug("EmailControl - Error while sending email " + err);
		}
	}
};

//Generate the email body as per the request (emailFor param) by user.
function generateMailOptions(fromEmail, toEmail, emailFor)
{
	var mailOptions;
	if(emailFor == 'activation')
	{
		mailOptions = {from:fromEmail, 
			to:toEmail, 
			subject:'Activate Account',
			html:'<html><body><div style="background-color:blue;color:white">Dear abc, activate acct</div></body></html>'};
	}
	else if(emailFor == 'forgotPassword')
	{
		mailOptions = {from:fromEmail, 
			to:toEmail, 
			subject:'Change Password',
			html:'<html><body><div style="background-color:blue;color:white">Dear abc, change password of ur acct</div></body></html>'};
	}
	return mailOptions;
};