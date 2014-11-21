"use strict";

/*global module, require*/

var d3 = require("d3"),
    body = d3.select(document.body),
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
	"demo",
	body,
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
	},
	function(newModel) {
	    model.text = model.text + " " + newModel.text;
	    text.node().value = model.text;
	});

text.node().value = model.text;
