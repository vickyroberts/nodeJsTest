var mongoose = require("mongoose");
//Schema for storing user secrets
var masterSchema = mongoose.Schema;

//Create the master collection i.e. default data required on the page to be displayed.
var masterCollection = new masterSchema({
	relation: {personal:[String],organization:[String]},
	floatType: [String],
	groupType: [String],
	activityType: [String],
	country:[{countryId:Number,countryName:String}],
	state:[{stateId:Number,stateName:String,countryId:Number}],
	city:[{cityId:Number,cityName:String,stateId:Number,countryId:Number}],
	qualificationTags:[String],
	skillsTags:[String],
	jobLocationPrefTags:[String],
	matriExpectedQualificationTags:[String],
	matriExpectedJobTags:[String],
	matriExpectedPreferedLocationTags:[String]	
});

module.exports = mongoose.model('MasterCollection',masterCollection)

