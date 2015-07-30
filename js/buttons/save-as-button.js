"use strict";

/*global module, require*/

var modalDialogueFactory = require("./processes/modal-dialogue.js"),
    commentFactory = require("./accordion-comment.js"),

    online = {
	online: true,
	offline: false
    },

    standalone = {
	embedded: false,
	standalone: true
    }; 

module.exports = function(store, spec, closeFileMenu, friendlyName) {
    var modalDialogueProcess = modalDialogueFactory(closeFileMenu),

	capitalizeFirst = function(str) {
	    return str[0].toUpperCase() + str.slice(1);
	};

    return spec.button(
	"Save As",
	null,
	function(wasActive, buttonProcess, onProcessEnd) {
	    var dialogue = modalDialogueProcess(wasActive, buttonProcess, onProcessEnd),

		submit = function() {
		    var title = titleInput.node().value;

		    if (!title) {
			return;
		    }
		    
		    store.saveDocument(title);

		    // ToDo do something with this.
		    // comment.getComment();
		    
		    dialogue.exit();
		},

		head = dialogue.element.append("h4")
		    .text("Save this " + friendlyName),

		titleLabel = dialogue.element.append("label")
		    .text(capitalizeFirst(friendlyName) + " name"),

		titleInput = dialogue.element.append("input")
		    .attr("type", "text"),

		projectLabel = dialogue.element.append("label")
		    .text("Save to project"),

		projectSelect = dialogue.element.append("select"),

		projectOptionPlaceholder = projectSelect.append("option")
		    .text("Project Name")
		    .attr("disabled", true)
		    .attr("selected", true),

		projectOptions = projectSelect.selectAll("option.project-choice")
		    .data(["Dummy Project"]);

	    projectOptions.exit().remove();
	    projectOptions.enter().append("option")
		.classed("project-choice", true)
		.text(function(d, i) {
		    return d;
		});

	    var comment = commentFactory(dialogue.element, submit),
		
		action = dialogue.element.append("div")
		    .classed("dialogue-action", true)
		    .attr("save-as-action", true)
		    .on("click", submit)
		    .text("Save");

	    return dialogue;
	},
	{
	    onlineOffline: online,
	    embeddedStandalone: standalone,
	    search: {
		excludeTerms: spec.matchEmpty,
		includeSearchTerm: true
	    }
	}
    );
};
