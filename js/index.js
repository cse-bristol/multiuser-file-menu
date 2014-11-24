"use strict";

/*global module, require*/

var backendFactory = require("./backend.js"),
    menuFactory = require("./menu.js"),
    standardButtonFactory = require("./standard-buttons.js"),
    storeFactory = require("./store.js"),
    queryStringFactory = require("./query-string.js"),
    defaultUrl = function() {
	var a = document.createElement("a");
	a.href = "/";
	return a.href + "channel";
    }();

module.exports = function(collection, serialize, deserialize, getModel, setModel, freshModel, url) {
    var backend = backendFactory(url ? url : defaultUrl),
	standardButtons = standardButtonFactory(),
	store = storeFactory(collection, backend, standardButtons, serialize, deserialize, getModel, setModel, freshModel),
	queryString = queryStringFactory(standardButtons, collection);

    return {
	backend: backend,
	store: store,
	queryString: queryString,
	standard: standardButtons,
	buildMenu: function(container, extraButtons) {
	    menuFactory(
	    container,
	    collection,
	    standardButtons.buttonSpec().concat(extraButtons),
	    standardButtons.getTitle,
	    backend.search,
	    backend.onUp,
	    backend.onDown,
	    backend.isUp);
	}
    };
};

