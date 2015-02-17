"use strict";

/*global module, require*/

var backendFactory = require("./backend.js"),
    menuFactory = require("./menu.js"),
    standardButtonFactory = require("./standard-buttons.js"),
    storeFactory = require("./store.js"),
    queryStringFactory = require("./query-string.js"),
    buttonSpecFactory = require("./specify-buttons.js"),
    menuStateFactory = require("./menu-state.js"),
    defaultUrl = function() {
	var a = document.createElement("a");
	a.href = "/";
	return a.href + "channel";
    }();

module.exports = function(collection, serialize, deserialize, getModel, setModel, freshModel, url) {
    var backend = backendFactory(url ? url : defaultUrl),
	buttonSpec = buttonSpecFactory(collection),
	standardButtons = standardButtonFactory(buttonSpec),
	store = storeFactory(collection, backend, standardButtons, serialize, deserialize, getModel, setModel, freshModel),
	queryString = queryStringFactory(
	    standardButtons,
	    collection
	),
	menuState = menuStateFactory(
	    backend.onUp,
	    backend.onDown,
	    backend.isUp,
	    backend.stayConnected,
	    store.onAutoSaveChanged,
	    store.autoSave,
	    standardButtons.onTitleChange,
	    standardButtons.getTitle,
	    store.onVersionChanged,
	    store.getVersion
	);

    return {
	backend: backend,
	store: store,
	queryString: queryString,
	standard: standardButtons,
	spec: buttonSpec,
	buildMenu: function(container, extraButtons) {
	    menuFactory(
		container,
		standardButtons.buttonSpec().concat(extraButtons),
		standardButtons.getTitle,
		backend.search,
		menuState
	    );
	}
    };
};

