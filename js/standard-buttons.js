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
	onTitleChange = callbacks(),
	version,
	onVersionChanged = callbacks(),
    	onNew = callbacks(),
	onOpen = callbacks(),
	onSaveAs = callbacks(),
	onDelete = callbacks(),
	onAutoSaveChange = callbacks(),

	searchProcess = function(resultFunction, options) {
	    return searchFactory(backendSearch, collection, resultFunction, options);
	},

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
		    var submenu = historySubMenu.init(buttonElement);

		    submenu.text("Histoire");
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
	    function(result) {
		if (result === title) {
		    setTitle(null);
		    onNew();
		}		
		onDelete(result);
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
		
		setTitle(result, false);
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

	onAutoSaveChange: onAutoSaveChange.add,

	/*
	 ToDo

	 We need a way to provide a list of dates for historical versions.
	 */
	setVersion: function(v, maxV) {
	    if (isNum(maxV)) {
		// ToDo
	    }
	    
	    if (v !== version) {
		if (isNum(v)) {
		    version = v;
		    // ToDo update history controls
		} else {
		    version = null;
		}

		onVersionChanged();
	    }
	},

	getVersion: function() {
	    return version;
	},

	erroneousVersion: function() {
	    // ToDo do we still want this?
	    // In what cases could it trigger?
	},

	onVersionChanged: onVersionChanged.add
    };
    return m;
};
