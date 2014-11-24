"use strict";

/*global module, require*/

var d3 = require("d3"),
    search = require("./search.js");

/*
 Provides UI buttons based on buttonSpec, an array of objects, each with the following properties:

 text: the text of the button.
 onlineOnly: indicates that the button should be hidden if we lose connection to the server.
 f: the action to take.
 hooks; a function to call on the resulting button.

 search: an object which indicates that we should perform a search before calling f with the result.
 search.collection: the collection to search within.
 search.alwaysIncludeSearchText: the text which was searched for should always be returned as a result (useful for save as).
 search.forbidEmpty: will never execute a search against the empty string "".

 */
module.exports = function(container, buttonSpec, getTitle, searchFunction, onUp, onDown, isUp) {
    var lastSearch = null,
	activeButton = null,
	buttons = container.selectAll("div.document-control-button")
	    .data(buttonSpec)
	    .enter()
	    .append("div")
    	    .classed("document-control-item", true)
	    .classed("document-control-button", true)
	    .text(function(d, i) {
		return d.text;
	    })
	    .classed("online-only", function(d, i) {
		return d.onlineOnly;
	    })
	    .on("click", function(d, i) {
		var button = d3.select(this);
		
		if (d.search) {
		    hideSearch();
		    clearActive();
		    activeButton = button;
		    activeButton.classed("active", true);
	    
		    lastSearch = search(
			container,
			searchFunction,
			d.search.collection,
			d.search.alwaysIncludeSearchText,
			d.search.forbidEmpty,
			getTitle(),
			function() {
			    clearActive();
			    d.f.apply(this, arguments);
			},
			clearActive
 		    );
			
		} else {
		    d.f(button);
		}
	    })
	    .each(function(d, i) {
		if (d.hooks) {
		    var el = d3.select(this);
		    d.hooks(el);
		}
	    }),

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
	
	enable = function() {
	    container.classed("offline", false);
	},

	disable = function() {
	    hideSearch();
	    clearActive();

	    container.classed("offline", true);
	};

    /*
     Run a search, then execute a command once a search item is clicked.
     
     The clicked button will be highlighted while this is going on.
     */
    var withSearch = function(collection, alwaysIncludeSearchText, forbidEmpty, title, callback) {
	return function(button) {
	    
	};
    };

    container.append("div")
	.classed("offline-only", true)
        .classed("document-control-item", true)
	.text("Offline");

    onUp(enable);
    onDown(disable);
    if (isUp()) {
	enable();
    } else {
	disable();
    }
};
