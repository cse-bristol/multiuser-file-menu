"use strict";

/*global module, require*/

var backendFactory = require("./backend.js"),
    menuFactory = require("./menu.js"),
    storeFactory = require("./store.js"),
    queryStringFactory = require("./query-string.js"),
    defaultUrl = function() {
	var a = document.createElement("a");
	a.href = "/";
	return a.href + "channel";
    }();

module.exports = function(collection, container, serialize, deserialize, getModel, setModel, freshModel, mergeModel, url) {
    var backend = backendFactory(collection, url ? url : defaultUrl),
	menu = menuFactory(container, backend.search, backend.onUp, backend.onDown, backend.isUp),
	store = storeFactory(backend, menu, serialize, deserialize, getModel, setModel, freshModel, mergeModel),
	queryString = queryStringFactory(menu, collection);

    return {
	backend: backend,
	menu: menu,
	store: store,
	queryString: queryString
    };
	
};

