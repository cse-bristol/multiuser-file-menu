"use strict";

/*global module, require*/

var d3 = require("d3");

/*
 Provides UI buttons based on buttonSpec, which should be an array containing objects generated using specify-buttons.js.
 */
module.exports = function(container, helpURL) {
    var menu = container.append("div")
	    .attr("id", "menu-bar"),

	file = menu.append("div")
	    .attr("id", "file-menu")
	    .classed("menu-item", true)
	    .text("File")
	    .datum(false)
	    .on("click", function(d, i) {
		d3.select(this)
		    .datum(!d);

		file.classed("enabled", !d);
		fileContents
		    .classed("enabled", !d);
		    // .transition()
		    // .style("transform", "scale(1," + (d ? 0 : 1) + ")");
	    }),

	help = menu.append("a")
	    .attr("id", "help")
	    .classed("menu-item", true)    
	    .text("? Help")
	    .attr("href", helpURL),

	fileContents = menu.append("div")
	    .attr("id", "file-menu-contents");

    return {
	contents: fileContents
    };
};
