var configValues = {
	smtpIp:'184.173.93.130',
	smtpPort:25,
	smtpUser:'tcs@thelisteningportal.com',
	smtpPass:'tata@1234',
	smtpFromUser:'vicky.roberts@gmail.com',
	emailTemplatePath:'Templates/EmailTemplateBasic.htm',
	activationMessage: 'Thank you for registering on Famhook.com. To activate your account please click on the link below',
	activationSuject: 'Famhook : Activate your account',
	activationLink:'http://localhost:3000/api/activateacct?uid={userid}',
	forgotPasswordMessage: 'We received a request to reset the password for your account.<br><br>If you requested a reset, click the link below. If you didn’t make this request, please ignore this email.',
	forgotPasswordSuject: 'Famhook : Reset your password',		
	forgotPasswordLink:'http://localhost:3000/api/resetpassword?uid={userid}',
};

module.exports = configValues;
