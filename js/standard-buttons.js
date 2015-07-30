"use strict";

/*global module, require*/

var d3 = require("d3"),
    _ = require("lodash"),
    helpers = require("./helpers.js"),
    isNum = helpers.isNum,
    callbacks = helpers.callbackHandler,

    searchFactory = require("./search.js"),
    subMenuFactory = require("./sub-menu.js"),

    online = {
	online: true,
	offline: false
    },

    standalone = {
	embedded: false,
	standalone: true
    }; 

/*
 Provides a set of pre-specified buttons: New, Open, Save as, and Delete.

 Provides callbacks for these buttons.

 Keeps track of the document title, and whether or not it is a temporary title.
 */
module.exports = function(spec, backendSearch, collection) {
    var title = null,
	onTitleOrVersionChange = callbacks(),
	version = null,
    	onNew = callbacks(),
	onOpen = callbacks(),
	onSaveAs = callbacks(),
	onDelete = callbacks(),
	onAutoSaveChange = callbacks(),

	searchProcess = function(resultFunction, options) {
	    return searchFactory(backendSearch, collection, resultFunction, options);
	},

	setTitleAndVersion = function(newTitle, newVersion) {
	    if (title === newTitle && version === newVersion) {
		return;
	    }

	    title = newTitle;

	    if (isNum(newVersion)) {
		version = parseInt(newVersion);
	    } else {
		version = newVersion;
	    }

	    onTitleOrVersionChange(title, version);
	},

	newDoc = function() {
	    setTitleAndVersion(null, null);
	    onNew();
	},

	open = function(title, version) {
	    setTitleAndVersion(title, version);
	    onOpen(title, version);
	},

	offlineIndicator = spec.button(
	    "Connecting",
	    null,
	    function() {
		// Noop
	    },
	    {
		onlineOffline: {
		    online: false,
		    offline: true
		},
		embeddedStandalone: standalone,
		hooks: function(el) {
		    el.attr("id", "offline-indicator")
			.classed("active", true)
			.style("width", "8em");
		}
	    }
	),

	newButton = spec.button(
	    "New",
	    null,
	    newDoc,
	    {
		embeddedStandalone: standalone
	    }
	),

	openButton = spec.button(
	    "Open",
	    function(menuState, ownsCurrentProcess) {
		return ownsCurrentProcess;
	    },
	    searchProcess(open, {}),
	    {
		onlineOffline: online,
		embeddedStandalone: standalone
	    }
	),

	historySubMenu = subMenuFactory(),
	historyContent,
	updateHistoryControls = function(versionsList) {
	    if (historyContent) {
		var versionEntries = historyContent
			.selectAll(".version-entry")
			.data(versionsList);

		versionEntries.exit().remove();

		versionEntries.enter()
		    .append("div")
		    .classed("version-entry", true)
		    .text(function(d, i) {
			return new Date(
			    parseInt(d.ts)
			)
			    .toLocaleString();
		    })
		    .on("click", function(d, i) {
			d3.event.stopPropagation();

			if (d.v === version) {
			    open(title, null);
			} else {
			    open(title, d.v);
			}
		    });

		versionEntries.classed("current-version", function(d, i) {
		    return d.v === version;
		});

		versionEntries.order();
	    }
	},
	historyButton = spec.button(
	    "History",
	    function(menuState, ownsCurrentProcess) {
		return historySubMenu.isEnabled();
	    },
	    function(wasActive, currentTitle, buttonElement, onProcessEnd) {
		if (!wasActive) {
		    return historySubMenu.startProcess(buttonElement, onProcessEnd);
		} else {
		    return null;
		}
	    },
	    {
		hover: true,
		onlineOffline: online,
		readWriteSync: {
		    untitled: false,
		    read: true,
		    write: true,
		    sync: true
		},		
		embeddedStandalone: standalone,
		hooks: function(buttonElement) {
		    historyContent = historySubMenu.init(buttonElement);
		}
	    }
	),

	autosaveButton = spec.button(
	    "Auto",
	    function(menuState) {
		return menuState.sync();
	    },
	    function(wasActive) {
		if (!wasActive) {
		    /*
		     Sync the document before listening to changes.
		     */
		    onSaveAs(title);
		}
		onAutoSaveChange(!wasActive);
	    },
	    {
		onlineOffline: online,
		readWriteSync: {
		    untitled: false,
		    read: false,
		    write: true,
		    sync: true
		}
	    }
	),

	deleteButton = spec.button(
	    "Delete",
	    null,
	    function() {
		if (title) {
		    onDelete(title);
		    setTitleAndVersion(null, null);
		    onNew();
		}
	    },
	    {
		onlineOffline: online,
		embeddedStandalone: standalone,
		search: {}
	    }
	),

	saveButton = spec.button(
	    "Save",
	    null,
	    function() {
		onSaveAs(title);
	    },
	    {
		onlineOffline: online,
		readWriteSync: {
		    untitle: false,
		    read: false,
		    write: true,
		    sync: false
		}
	    }
	),
	
	saveAsButton = spec.button(
	    "Save as",
	    null,
	    function(result) {
		if (title === result) {
		    return;
		}
		
		setTitleAndVersion(result, null);
		onSaveAs(result);
	    },
	    {
		onlineOffline: online,
		embeddedStandalone: standalone,
		search: {
		    excludeTerms: spec.matchEmpty,
		    includeSearchTerm: true
		}
	    }
	),

	popOutButton = spec.button(
	    "Pop Out",
	    null,
	    function() {
		window.open(document.location, "_blank");
	    },
	    {
		embeddedStandalone: {
		    embedded: true,
		    standalone: false
		}
	    }
	),

	standardButtons = [
	    offlineIndicator,
	    popOutButton,
	    newButton,
	    openButton,
	    saveButton,
	    saveAsButton,
	    autosaveButton,
	    historyButton,
	    deleteButton
	];

    var m =  {
	buttonSpec: function() {
	    return standardButtons;
	},
	
	getTitle: function() {
	    return title;
	},
	onTitleOrVersionChange: onTitleOrVersionChange.add,
	
	newDoc: newDoc,
	onNew: onNew.add,
	
	open: open,
	onOpen: onOpen.add,
	
	onSaveAs: onSaveAs.add,
	onDelete: onDelete.add,

	onAutoSaveChange: onAutoSaveChange.add,

	setVersionsList: function(documentName, versionsList) {
	    if (documentName === title) {
		updateHistoryControls(versionsList);
	    }
	},

	getVersion: function() {
	    return version;
	}
    };
    return m;
};
