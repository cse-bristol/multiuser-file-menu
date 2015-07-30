"use strict";

/*global module, require*/

var d3 = require("d3");

module.exports = function(container) {
    var comment = container.append("fieldset")
	    .classed("comment", true),

	commentLabel = comment.append("label")
	    .text("Add a comment")
	    .on("click", function() {
		comment.classed(
		    "expanded",
		    !comment.classed("expanded")
		);
	    }),

	commentField = comment.append("textarea");

    return {
	getComment: function() {
	    return commentField.node().value;
	}
    };
};
