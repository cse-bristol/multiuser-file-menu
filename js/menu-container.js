"use strict";

/*global module, require*/

var d3 = require("d3"),
    helpers = require("./helpers.js"),
    callbacks = helpers.callbackHandler;

/*
 Provides UI buttons based on buttonSpec, which should be an array containing objects generated using specify-buttons.js.
 */
module.exports = function(container, helpURL) {
    var onVisibilityChanged = callbacks(),

	updateVisibility = function(visible) {
	    file.datum(visible);

	    if (onVisibilityChanged) {
		onVisibilityChanged(visible);
	    }

	    file.classed("active", visible);
	    fileContents
		.classed("active", visible);
	},
	
	menu = container.append("div")
	    .attr("id", "menu"),

	menuBar = menu.append("div")
	    .attr("id", "menu-bar"),

	file = menuBar.append("div")
	    .attr("id", "file-menu")
	    .classed("menu-item", true)
	    .text("File")
	    .datum(false)
	    .on("click", function(d, i) {
		updateVisibility(!d);
	    }),

	help = menuBar.append("a")
	    .attr("id", "help")
	    .classed("menu-item", true)    
	    .text("? Help")
	    .attr("href", helpURL),

	fileContents = menu.append("div")
	    .attr("id", "file-menu-contents-wrapper")
	    .append("div")
	    .attr("id", "file-menu-contents");

    return {
	menuBar: menuBar,
	contentElement: fileContents,
	hide: function() {
	    updateVisibility(false);
	},
	onVisibilityChanged: onVisibilityChanged.add
    };
};
