"use strict";

/*global module, require*/

var d3 = require("d3");

/*
 A process which closes the file menu, and opens a modal dialogue.
 */
module.exports = function(closeFileMenu) {
    // This needs a way to hide the menu.
    return function(wasActive, buttonElement, onProcessEnd, submit) {
	var exit = function() {
	    wrapper.remove();
	    onProcessEnd();
	},

	    wrapper = d3.select("body")
		.append("div")
		.classed("modal-wrapper", true)
		.on("click", exit),
	    
	    dialogue = wrapper
		.append("form")
		.on("submit", function(d, i) {
		    d3.event.preventDefault();
		    submit();
		})
		.on("click", function() {
		    d3.event.stopPropagation();
		})
		.classed("modal", true);

	closeFileMenu();

	return {
	    element: dialogue,
	    exit: exit
	};
    };
};
