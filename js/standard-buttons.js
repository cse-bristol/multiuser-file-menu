"use strict";

/*global module, require*/

var d3 = require("d3"),
    helpers = require("./helpers.js"),
    callbacks = helpers.callbackHandler;

/*
 Provides a set of pre-specified buttons: New, Open, Save as, and Delete.

 Provides callbacks for these buttons.

 Keeps track of the document title, and whether or not it is a temporary title.
 */
module.exports = function(spec) {
    var title = null,
	onTitleChange = callbacks(),
    	onNew = callbacks(),
	onOpen = callbacks(),
	onSaveAs = callbacks(),
	onDelete = callbacks(),
	onAutoSaveChange = callbacks(),

	setTitle = function(newTitle) {
	    title = newTitle;
	    onTitleChange(title);
	},
	
	newDoc = function() {
	    setTitle(null);
	    onNew();
	},

	open = function(name, version) {
	    setTitle(name);
	    onOpen(name, version);
	};

    var standardButtons = [
	spec.button(
	    "New",
	    newDoc,
	    {
		embeddedStandalone: {
		    embedded: false,
		    standalone: true
		}
	    }
	),

	spec.button(
	    "Open",
	    open,
	    {
		onlineOffline: {
		    online: true,
		    offline: false
		},
		embeddedStandalone: {
		    embedded: false,
		    standalone: true
		},
		search: {}
	    }
	),

	spec.button(
	    // Toggle: this half goes from manual -> auto
	    "Auto",
	    function() {
		/*
		 Sync the document, then listen to further changes.
		 */
		onSaveAs(title);
		onAutoSaveChange(true);
	    },
	    {
		onlineOffline: {
		    online: true,
		    offline: false
		},
		readWriteSync: {
		    read: false,
		    write: true,
		    sync: false
		},
		confirm: false,
		hooks: function(button) {
		    button
			.select(".confirmation")
			.text("X")
			.style("opacity", 1)
			.style("color", "darkred");
		}		
	    }
	),

	spec.button(
	    // Toggle: this half goes from auto -> manual
	    "Auto",
	    function() {
		onAutoSaveChange(false);
	    },
	    {
		onlineOffline: {
		    online: true,
		    offline: false
		},
		readWriteSync: {
		    read: false,
		    write: false,
		    sync: true
		},
		confirm: false,
		hooks: function(button) {
		    button
		    	.classed("active", true)
			.select(".confirmation")
			// The standard green looks bad against the darker background.
			.style("color", "lime")
			.style("opacity", 1);
		}
	    }
	),	

	spec.button(
	    "Delete",
	    function(result) {
		if (result === title) {
		    setTitle(null);
		    onNew();
		}		
		onDelete(result);
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
		search: {}
	    }
	),

	spec.button(
	    "Save",
	    function() {
		onSaveAs(title);
	    },
	    {
		onlineOffline: {
		    online: true,
		    offline: false
		},
		readWriteSync: {
		    read: false,
		    write: true,
		    sync: false
		}
	    }
	),
	
	spec.button(
	    "Save as",
	    function(result) {
		if (title === result) {
		    return;
		}
		
		setTitle(result, false);
		onSaveAs(result);
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
		    excludeTerms: spec.matchEmpty,
		    includeSearchTerm: true
		}
	    }
	),

	spec.button(
	    "Pop Out",
	    function() {
		window.open(document.location, "_blank");
	    },
	    {
		embeddedStandalone: {
		    embedded: true,
		    standalone: false
		}
	    }
	)
    ];

    return {
	buttonSpec: function() {
	    return standardButtons;
	},
	
	setTitle: setTitle,
	getTitle: function() {
	    return title;
	},
	onTitleChange: onTitleChange.add,
	
	newDoc: newDoc,
	onNew: onNew.add,
	
	open: open,
	onOpen: onOpen.add,
	
	onSaveAs: onSaveAs.add,
	onDelete: onDelete.add,

	onAutoSaveChange: onAutoSaveChange.add
    };
};
