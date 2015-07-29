"use strict";

/*global module, require*/

var d3 = require("d3"),
    epsilon = 0.0001;

/*
 Controls which buttons are currently hidden or displayed within the menu.
 */
module.exports = function(menuContainer, buttonSpec, getTitle, menuState) {
    /*
     A process represents a sequences of steps that a button may initiate.
     Clicking a button ends the current process.
    */
    var process = null,

	killProcess = function() {
	    if (process) {
		process.exit();
		process = null;
	    }
	},

	processDied = function() {
	    process = null;
	    updateButtons();
	},

	setStateClass = function(selection, state) {
	    selection.classed(state, function(d, i) {
		return d.state === state;
	    });
	},

	updateButtons = function() {
	    menuContainer.contentElement.selectAll(".menu-item")
		.each(function(d, i) {
		    d.state = d.getState(
			menuState,
			process && process.button.datum() === d
		    );
		})
		.call(setStateClass, "active")
	    	.call(setStateClass, "ready")
	    	.call(setStateClass, "disabled");
	};

    buttonSpec.forEach(function(spec) {
	var trigger = function() {
		    killProcess();
		    
		    process = spec.f(
			spec.state === "active",
			getTitle(),
			d3.select(this),
			processDied
		    );

		    updateButtons();
		},
	
	    button = menuContainer.contentElement
		.append(spec.element)
		.datum(spec)
	        .classed("menu-item", true)
		.attr("id", function(d, i) {
		    return "file-menu-" + spec.text;
		})
	    	.text(function(d, i) {
		    return spec.text;
		})
	    	.on("click", trigger);

	if (spec.hover) {
	    button.on("mouseenter", trigger);
	}

	spec.hooks(button);
    });

    menuState.onChange(updateButtons);
    menuContainer.onHide(function() {
	killProcess();
	updateButtons();
    });
    updateButtons();

    return {
	updateButtons: updateButtons
    };
};
