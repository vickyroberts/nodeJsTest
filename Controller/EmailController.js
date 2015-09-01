var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var promise = require("bluebird");
var pg = require('pg');
var path = require('path');
var fs = require('fs');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
//Custom packages
var logger = require("../logger");
var propertyFile = require("../PropertiesValue.js");
var conn = require("./Connection.js");

promise.promisifyAll(mongoose);
promise.promisifyAll(pg);
var mailSettings = {host:propertyFile.smtpIp, port:propertyFile.smtpPort, auth:{user:propertyFile.smtpUser,pass:propertyFile.smtpPass}};

//Send email alert as per the mailfor request (parameter)
exports.sendEmailAlert = function(req, res)
{
	if(req && req.body.emailto && req.body.emailfrom && req.body.mailfor)
	{
		try
		{
			var pschemaName = conn.getDBSchema("");     
			conn.getPGConnection(function(err, clientConn)
			{    
				if(err)
				{
					console.log("postUserLogin - Error while connection PG" + err);
					logger.debug("postUserLogin - Error while connection PG" + err);
				}
				else
				{
					//Get the user details for the email id passed.
					clientConn.queryAsync("SELECT us.username,us.extid,us.pageurlname, ud.firstname, ud.lastname FROM "+pschemaName+".tbusersecurity us LEFT JOIN "+pschemaName+".tbuserdetails ud on us.userid = ud.userid WHERE us.username = $1", [req.body.emailto]).then(function(result)
					{
						if(result && result.rows.length > 0)
						{
							//Create email body and get the object through callback.
							var transporter = nodemailer.createTransport(smtpTransport(mailSettings));
							generateMailOptions(req.body.emailfrom, req.body.emailto, result.rows[0].firstname, 
							result.rows[0].extid, req.body.mailfor, function(err, emailOption)
							{
								if(err)
								{
									console.log("EmailControl - Error while sending email " + err);
									logger.debug("EmailControl - Error while sending email " + err);
									res.send({message: "Error : Error while sending an email"});
								}
								else
								{
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
							});
						}
						else
						{
							console.log("EmailControl - Invalid email id");
							logger.debug("EmailControl - Invalid email id");
							res.send({message: "Error : Email id does not exist"});
						}						
					});
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
function generateMailOptions(fromEmail, toEmail, firstname, extUid, emailFor, callback)
{
	var mailOptions;	
	try
	{
		var filePath = path.resolve(__dirname);
		filePath = filePath.replace('Controller', '');
		filePath = filePath + propertyFile.emailTemplatePath;
		fs.readFile(filePath, 'utf8', function(err, data)
		{
			if(err)
			{
				callback("Error while creating email otion");					
			}
			else
			{
				var fileOutput = data;
				var mailSubject = propertyFile.activationSuject;
				var activationLink = propertyFile.activationLink.replace('{userid}', extUid);
				fileOutput = fileOutput.replace('{firstname}', firstname);
				if(emailFor == 'activation')
				{
					fileOutput = fileOutput.replace('{bodymessage}', propertyFile.activationMessage);
					fileOutput = fileOutput.replace('{actionlink}', activationLink);
				}
				else if(emailFor == 'forgotpass')
				{
					fileOutput = fileOutput.replace('{bodymessage}', propertyFile.forgotPasswordMessage);
					activationLink = propertyFile.forgotPasswordLink.replace('{userid}', extUid);
					fileOutput = fileOutput.replace('{actionlink}', activationLink);
					mailSubject = propertyFile.forgotPasswordSuject;
				}
				
				mailOptions = {from:fromEmail, 
				to:toEmail, 
				subject:mailSubject,
				html:fileOutput};
				callback(null, mailOptions);					
			}				
		});
	}
	catch(err)
	{
		callback("Error while creating email otion");
	}		
	
	return mailOptions;
};