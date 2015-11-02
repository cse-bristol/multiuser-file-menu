"use strict";

/*global module, require*/

var d3 = require("d3"),
    _ = require("lodash"),
    helpers = require("../helpers.js"),
    noop = helpers.noop,
    isNum = helpers.isNum,

    searchFactory = require("./processes/search.js"),
    saveAsButtonFactory = require("./save-as-button.js"),
    autosaveButtonFactory = require("./autosave-button.js"),
    historyButtonFactory = require("./history-button.js"),
    deleteButtonFactory = require("./delete-button.js"),

    online = {
	online: true,
	offline: false
    };

/*
 Provides a set of pre-specified buttons: New, Open, Save as, and Delete.

 Provides callbacks for these buttons.

 Keeps track of the document title, and whether or not it is a temporary title.
 */
module.exports = function(spec, store, backendSearch, getProjectsList, menuContainer, collection, friendlyName) {
    var searchProcess = function(resultFunction, options) {
	return searchFactory(backendSearch, store.getTitle, collection, resultFunction, options);
    },

	offlineIndicator = spec.button(
	    "Connecting",
	    null,
	    function() {
		return true;
	    },
	    {
		onlineOffline: {
		    online: false,
		    offline: true
		},
		hooks: function(el) {
		    el.attr("id", "offline-indicator")
			.classed("active", true);
		}
	    }
	),

	newButton = spec.button(
	    "New",
	    null,
	    store.newDocument,
	    {}
	),

	openButton = spec.button(
	    "Open",
	    function(menuState, ownsCurrentProcess) {
		return ownsCurrentProcess;
	    },
	    searchProcess(store.openDocument, {}),
	    {
		onlineOffline: online
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

	exitButton = spec.button(
	    "Exit",
	    null,
	    noop,
	    {}
	),
	    
	saveAsButton = saveAsButtonFactory(store, spec, menuContainer.hide, friendlyName, getProjectsList),
	autosaveButton = autosaveButtonFactory(store, spec.button, menuContainer.menuBar),
	historyButton = historyButtonFactory(store, spec.button),
	deleteButton = deleteButtonFactory(store, spec.button, menuContainer.hide),

	order = [
	    offlineIndicator,
	    newButton,
	    openButton,
	    saveButton,
	    saveAsButton,
	    autosaveButton,
	    historyButton,
	    deleteButton,
	    exitButton
	];

    /*
     Prepare your custom menu by disabling and/or inserting buttons, then get the ordered array and pass it to setButtons on the menu.
     */
    return {
	newButtons: newButton,
	openButton: openButton,
	saveButton: saveButton,
	saveAsButton: saveAsButton,
	autosaveButton: autosaveButton,
	historyButton: historyButton,
	deleteButton: deleteButton,

	insertBefore: function(toInsert, insertBefore) {
	    var i = order.indexOf(insertBefore);

	    if (i >= 0) {
		order.splice(i, 0, toInsert);
	    } else {
		throw new Error("Button to insert before does not exist or has already been disabled", insertBefore);
	    }
	},

	disable: function(button) {
	    var i = order.indexOf(button);
	    
	    if (i >= 0) {
		order.splice(i, 1);
	    } else {
		throw new Error("Button to disable does not exist or has already been disabled", button);
	    }
	},

	search: searchProcess,

	ordered: order
    };
};
