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
    toggle = false,
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
	menu.spec.button(
	    /*
	     This button searches a collection and alerts when a user clicks a result.
	     */
	    "Example",
	    null,
	    function(result) {
		alert("Searched the test collection and found " + result);
	    },
	    {
		onlineOffline: {
		    online: true,
		    offline: false
		},
		embeddedStandalone: {
		    embedded: false,
		    standalone: true
		},
		search: {
		    collection: coll,
		    excludeTerms: menu.spec.matchEmpty,
		    includeSearchTerm: true
		}
	    }
	),

	menu.spec.button(
	    /*
	     This button changes text every time the title of the page changes.
	     
	     It is an anchor tag instead of a div.
	     */
	    "Hook",
	    null,
	    function() {
		// Noop
	    },
	    {
		embeddedStandalone: {
		    embedded: false,
		    standalone: true
		},
		hooks: function(button) {
		    menu.standard.onTitleOrVersionChange(function(newTitle, newVersion) {
			button.text("Title: " + newTitle);
		    });
		}
	    }
	),

	menu.spec.button(
	    /*
	     Embeds an iframe in the page.
	     */
	    "Embed iframe",
	    null,
	    function() {
		body.append("iframe")
		    .attr("src", document.location)
		    .style("width", "400px")
		    .style("height", "400px")
		    .style("position", "absolute")
		    .style("right", 0)
		    .style("bottom", 0);
		
	    },
	    {
		embeddedStandalone: {
		    embedded: false,
		    standalone: true
		}
	    }
	),

	menu.spec.button(
	    /*
	     Makes an arbitrary change to the iframe's query string, allowing us to test it's messaging and history stuff.
	     */
	    "Push history",
	    null,
	    function() {
		menu.queryString.param(
		    "random",
		    function(val) {
			console.log("random", val);
		    },
		    function() {
			return Math.random();
		    }
		);

		menu.queryString.toURL();
	    },
	    {
		embeddedStandalone: {
		    embedded: true,
		    standalone: true
		}
	    }
	),

	menu.spec.button(
	    "Toggle",
	    function() {
		return toggle;
	    },
	    function(wasActive) {
		toggle = !wasActive;
	    },
	    {}
	)	
    ]);

menu.queryString.fromURL();

window.addEventListener("message", function(event) {
    console.log("iframe message", event.data, event.source.frameElement);
});
