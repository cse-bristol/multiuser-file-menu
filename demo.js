"use strict";

/*global module, require*/

var d3 = require("d3"),
    body = d3.select(document.body),
    coll = "demo",
    model = {
	text: "type here"
    },    
    text = body.append("textarea")
	.on("input", function(d, i) {
	    model.text = text.node().value;
	})
	.style("position", "absolute")
	.style("bottom", "1em")
	.style("left", "1em")
	.style("height", "5em")
	.style("width", "100%"),

    identity = function(o) {
	return o;
    },
    menu = require("./js/index.js")(
	coll,
	identity,
	identity,
	function() {
	    return model;
	},
	function(val) {
	    model = val;
	    text.node().value = val.text;
	},
	function() {
	    return {
		text: "type here"
	    };
	});

menu.buildMenu(
    body,
    /* 
     Example of how to add some extra buttons to the menu.
     */
    [
	{
	    /*
	     This button searches a collection and alerts when a user clicks a result.
	     */
	    text: "Example",
	    onlineOnly: true,
	    search: {
		collection: coll,
		alwaysIncludeSearchTerm: true,
		forbidEmpty: false
	    },
	    f: function(result) {
		alert("Searched the test collection and found " + result);
	    }
	},
	{
	    /*
	     This button changes text every time the title of the page changes.

	     It is an anchor tag instead of a div.
	     */
	    text: "Hook",
	    element: "a",
	    onlineOnly: false,
	    f: function() {
		// Noop
	    },
	    hooks: function(button) {
		menu.standard.onTitleChange(function(newTitle) {
		    button.text(newTitle);
		});
	    }
	}
    ]);

text.node().value = model.text;
