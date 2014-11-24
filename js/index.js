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

module.exports = function(collection, container, serialize, deserialize, getModel, setModel, freshModel, extraButtons, url) {
    var backend = backendFactory(url ? url : defaultUrl),
	standardButtons = standardButtonFactory(),
	menu = menuFactory(
	    container,
	    collection,
	    standardButtons.buttonSpec().concat(extraButtons),
	    standardButtons.getTitle,
	    backend.search,
	    backend.onUp,
	    backend.onDown,
	    backend.isUp),
	
	store = storeFactory(collection, backend, standardButtons, serialize, deserialize, getModel, setModel, freshModel),
	
	queryString = queryStringFactory(standardButtons, collection);

    return {
	backend: backend,
	menu: menu,
	store: store,
	queryString: queryString,
	standardButtons: standardButtons
    };
};

