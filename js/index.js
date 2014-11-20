"use strict";

/*global module, require*/

var backendFactory = require("./backend.js"),
    menuFactory = require("./menu.js"),
    storeFactory = require("./store.js"),
    defaultUrl = function() {
	var a = document.createElement("a");
	a.href = "/";
	return a.href + "channel";
    }();

module.exports = function(container, serialize, deserialize, getModel, setModel, freshModel, url) {
    var backend = backendFactory("test", url ? url : defaultUrl),
	menu = menuFactory(container, backend.search),
	store = storeFactory(backend, menu, serialize, deserialize, getModel, setModel, freshModel);

    return {
	backend: backend,
	menu: menu,
	store: store
    };
	
};

