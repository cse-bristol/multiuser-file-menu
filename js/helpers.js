"use strict";

/*global module, require*/

var d3 = require("d3");

module.exports = {
    callbackHandler: function() {
	var callbacks = [];
	
	var f = function() {
	    var args = arguments;
	    callbacks.forEach(function(c) {
		c.apply(this, args);
	    });
	};
	f.add = function(c) {
	    callbacks.push(c);
	};

	f.remove = function(c) {
	    var i = callbacks.indexOf(c);
	    if (i >= 0) {
		callbacks.splice(i, 1);
	    }
	};

	return f;
    },
    isNum: function (n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
    },    
    noop: function() {
    }
};
