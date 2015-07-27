"use strict";

/*global module, require*/

var d3 = require("d3"),
    search = require("./search.js"),
    epsilon = 0.0001;

/*
 Controls which buttons are currently hidden or displayed within the menu.
 */
module.exports = function(container, buttonSpec, getTitle, searchFunction, menuState) {
    var setStateClass = function(selection, state) {
	selection.classed(state, function(d, i) {
	    return d.state === state;
	});
    },

	updateButtons = function() {
	    container.selectAll(".menu-item")
		.each(function(d, i) {
		    d.state = d.getState(menuState);
		})
		.call(setStateClass, "active")
	    	.call(setStateClass, "ready")
	    	.call(setStateClass, "inactive");
	};

    buttonSpec.map(function(spec) {
	var button = container.append('div')
		.datum(spec)
	        .classed("menu-item", true)
		.attr("id", function(d, i) {
		    return "file-menu-" + spec.text;
		})
	    	.text(function(d, i) {
		    return spec.text;
		})
	    	.on("click", function(d, i) {
		    spec.f(
			spec.state === "active"
		    );

		    updateButtons();
		});

	spec.hooks(button);

	return button;
    });

    menuState.onChange(updateButtons);
    updateButtons();

    return {
	updateButtons: updateButtons
    };
    
};
