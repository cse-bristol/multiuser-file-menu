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

module.exports = function(store, specifyButton, closeFileMenu) {
    var modalDialogueProcess = modalDialogueFactory(closeFileMenu);
    
    return specifyButton(
	"Delete",
	null,
	function(wasActive, buttonProcess, onProcessEnd) {
	    if (store.getTitle()) {
		var submit = function() {
		    store.deleteDocument(
			store.getTitle()
		    );

		    // ToDo do something with this.
		    // comment.getComment();
		    
		    dialogue.exit();
		},

		    dialogue = modalDialogueProcess(wasActive, buttonProcess, onProcessEnd, submit),

		    head = dialogue.element.append("h4")
			.text("Delete '" + store.getTitle() + "'"),

		    comment = commentFactory(dialogue.element),
		    
		    action = dialogue.element.append("div")
			.classed("dialogue-action", true)
			.attr("delete-action", true)
			.on("click", submit)
			.text("Delete");

		return dialogue;
	    } else {
		return null;
	    }
	},
	{
	    onlineOffline: online,
	    embeddedStandalone: standalone,
	    readWriteSync: {
		untitled: false,
		read: false,
		write: true,
		sync: true
	    }
	}
    );
};
