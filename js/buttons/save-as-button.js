"use strict";

/*global module, require*/

var modalDialogueFactory = require("./processes/modal-dialogue.js"),
    commentFactory = require("./accordion-comment.js"),

    online = {
	online: true,
	offline: false
    };

module.exports = function(store, spec, closeFileMenu, friendlyName, getProjectsList) {
    var modalDialogueProcess = modalDialogueFactory(closeFileMenu),

	capitalizeFirst = function(str) {
	    return str[0].toUpperCase() + str.slice(1);
	};

    return spec.button(
	"Save As",
	null,
	function(wasActive, buttonProcess, onProcessEnd) {
	    var checkEnabled = function() {
		var hasValues = projectSelect.node().value && titleInput.node().value;

		action.classed("enabled", hasValues ? true : null);
	    },

		dialogue = modalDialogueProcess(wasActive, buttonProcess, onProcessEnd),

		submit = function() {
		    var title = titleInput.node().value;

		    if (!title) {
			return;
		    }

		    store.saveDocument(title, projectSelect.node().value);

		    // ToDo do something with this.
		    // comment.getComment();
		    
		    dialogue.exit();
		},

		head = dialogue.element.append("h4")
		    .text("Save this " + friendlyName),

		titleLabel = dialogue.element.append("label")
		    .text(capitalizeFirst(friendlyName) + " name"),

		titleInput = dialogue.element.append("input")
		    .attr("type", "text")
		    .on("input", checkEnabled);

	    titleInput.node().value = store.getTitle() || '';

	    var projectLabel = dialogue.element.append("label")
		    .text("Save to project"),

		projectSelect = dialogue.element.append("select")
	    	    .on("change", checkEnabled),

		projectOptionPlaceholder = projectSelect.append("option")
		    .text("Project Name")
		    .classed("option-placeholder", true)
		    .attr("value", "")
	    	    .attr("default", "")
		    .attr("disabled", true)
		    .attr("selected", "selected"),

		projectOptions = projectSelect.selectAll("option.project-choice")
		    .data(getProjectsList());

	    projectOptions.exit().remove();
	    projectOptions.enter().append("option")
		.classed("project-choice", true)
		.text(function(d, i) {
		    return d;
		})
		.attr("selected", function(d, i) {
		    if (store.getProject() === d) {
			projectOptionPlaceholder.attr("selected", null);
			
			return true;
		    } else {
			return null;
		    }
		});

	    var comment = commentFactory(dialogue.element, submit),
		
		action = dialogue.element.append("div")
		    .classed("dialogue-action", true)
		    .attr("save-as-action", true)
		    .on("click", submit)
		    .text("Save");

	    checkEnabled();

	    return dialogue;
	},
	{
	    onlineOffline: online
	}
    );
};
