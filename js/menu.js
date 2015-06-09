"use strict";

/*global module, require*/

var d3 = require("d3"),
    search = require("./search.js"),
    epsilon = 0.0001;

/*
 Provides UI buttons based on buttonSpec, which should be an array containing objects generated using specify-buttons.js.
 */
module.exports = function(container, buttonSpec, getTitle, searchFunction, menuState) {
    var lastSearch = null,
	activeButton = null,
	clearActive = function() {
	    if (activeButton) {
		activeButton.classed("active", false);
		activeButton = null;
	    }
	},

	hideSearch = function() {
	    if (lastSearch) {
		lastSearch.hide();
		lastSearch = null;
	    }
	},

	confirm = function(el) {
	    el.select(".confirmation")
		.style("opacity", 1)
		.transition()
		.duration(1000)
		.style("opacity", epsilon);
	},

	updateButtons = function() {
	    buttons.style("display", function(d, i) {
		return (
		    /*
		     Check the current menu state against the states allowed by spec for this button.
		     */
		    d.onlineOffline[menuState.online() ? "online" : "offline"]
			&& d.readWriteSync[menuState.readWriteSync()]
			&& d.embeddedStandalone[menuState.embedded() ? "embedded" : "standalone"]
			&& d.extraDisplayCondition()
		    
		) ? "inline-block" : "none";
	    });
	};

    buttonSpec.map(function(spec) {
	var button = container.append(spec.element)
		.datum(spec)
	        .classed("document-control-item", true)
		.classed("document-control-button", true)
	    	.text(function(d, i) {
		    return spec.text;
		})
	    	.on("click", function(d, i) {
		    var el = d3.select(this);
		    
		    if (spec.search) {
			hideSearch();
			clearActive();
			activeButton = el;
			activeButton.classed("active", true);

			var searchOptions = Object.create(spec.search);

			searchOptions.currentPage = getTitle();
			searchOptions.f = function() {
			    clearActive();
			    spec.f.apply(this, arguments);
			    if (spec.confirm) {
				confirm(el);
			    }
			    updateButtons();
			};
			
			lastSearch = search(
			    container,
			    searchFunction,
			    clearActive,
			    searchOptions
 			);
			
		    } else {
			spec.f(button);
			if (spec.confirm) {
			    confirm(el);
			}
			updateButtons();
		    }
		});

	button.append("span")
	    .text("✓")
	    .classed("confirmation", true)
	    .style("opacity", epsilon);


	spec.hooks(button);

	return button;
    });

    var buttons = container.selectAll(".document-control-item");

    menuState.onChange(updateButtons);
    updateButtons();

    return {
	updateButtons: updateButtons
    };
};
