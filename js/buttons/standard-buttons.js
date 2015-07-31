"use strict";

/*global module, require*/

var d3 = require("d3"),
    _ = require("lodash"),
    helpers = require("../helpers.js"),
    isNum = helpers.isNum,

    searchFactory = require("./processes/search.js"),
    saveAsButtonFactory = require("./save-as-button.js"),
    autosaveButtonFactory = require("./autosave-button.js"),
    historyButtonFactory = require("./history-button.js"),
    deleteButtonFactory = require("./delete-button.js"),

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
module.exports = function(spec, store, backendSearch, menuContainer, collection, friendlyName) {
    var searchProcess = function(resultFunction, options) {
	return searchFactory(backendSearch, store.getTitle, collection, resultFunction, options);
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
	    store.newDocument,
	    {
		embeddedStandalone: standalone
	    }
	),

	openButton = spec.button(
	    "Open",
	    function(menuState, ownsCurrentProcess) {
		return ownsCurrentProcess;
	    },
	    searchProcess(store.openDocument, {}),
	    {
		onlineOffline: online,
		embeddedStandalone: standalone
	    }
	),

	saveButton = spec.button(
	    "Save",
	    null,
	    function() {
		store.saveDocument(
		    store.getTitle()
		);
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
	    saveAsButtonFactory(store, spec, menuContainer.hide, friendlyName),
	    autosaveButtonFactory(store, spec.button, menuContainer.menuBar),
	    historyButtonFactory(store, spec.button),
	    deleteButtonFactory(store, spec.button, menuContainer.hide)
	];

    return standardButtons;
};
