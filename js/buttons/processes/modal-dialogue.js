"use strict";

/*global module, require*/

var d3 = require("d3");

/*
 A process which closes the file menu, and opens a modal dialogue.
 */
module.exports = function(closeFileMenu) {
    // This needs a way to hide the menu.
    return function(wasActive, buttonElement, onProcessEnd, submit) {
	var dialogue = d3.select("body")
		.append("form")
		.on("submit", function(d, i) {
		    d3.event.preventDefault();
		    
		    submit();
		})
		.classed("modal", true);

	closeFileMenu();

	return {
	    element: dialogue,
	    
	    exit: function() {
		dialogue.remove();
		onProcessEnd();		
	    }
	};
    };
};
