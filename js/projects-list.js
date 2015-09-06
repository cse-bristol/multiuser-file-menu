"use strict";

/*global module, require*/

var d3 = require("d3"),

    helpers = require("./helpers.js"),
    callbacks = helpers.callbackHandler;

module.exports = function(url) {
    var projectsList = null;

    d3.json(
	[url, "projects"].join("/"),
	function(error, json) {
	    if (error) {
		console.error(error.response);
	    } else {
		projectsList = json;
	    }
	}
    );    
    
    return {
	get: function(callback) {
	    return projectsList || [];
	}
    };
};
