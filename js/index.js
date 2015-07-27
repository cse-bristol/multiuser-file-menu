"use strict";

/*global module, require*/

var iframeAntiScrolljack = require("iframe-anti-scrolljack"),
    backendFactory = require("./backend.js"),
    menuContainerFactory = require("./menu.js"),
    menuContentsFactory = require("./menu-contents.js"),
    standardButtonFactory = require("./standard-buttons.js"),
    storeFactory = require("./store.js"),
    queryStringFactory = require("./query-string.js"),
    buttonSpecFactory = require("./specify-buttons.js"),
    menuStateFactory = require("./menu-state.js"),
    defaultUrl = function() {
	var a = document.createElement("a");
	a.href = "/";
	return a.href + "channel";
    }(),

    isEmbedded = function() {
	try {
	    return window.self !== window.top;
	} catch (e) {
	    return true;
	}
    };

module.exports = function(collection, serialize, deserialize, getModel, setModel, freshModel, url, helpURL) {
    var embedded = isEmbedded();

    if (embedded) {
	iframeAntiScrolljack();
    }
    
    var backend = backendFactory(!embedded, url ? url : defaultUrl),
	buttonSpec = buttonSpecFactory(collection),
	standardButtons = standardButtonFactory(
	    buttonSpec,
	    backend.search,
	    collection
	),
	
	store = storeFactory(!embedded, collection, backend, standardButtons, serialize, deserialize, getModel, setModel, freshModel),
	queryString = queryStringFactory(
	    standardButtons,
	    collection
	),
	menuState = menuStateFactory(
	    embedded,
	    backend.onUp,
	    backend.onDown,
	    backend.isUp,
	    store.onAutoSaveChanged,
	    store.autoSave,
	    standardButtons.onTitleChange,
	    standardButtons.getTitle,
	    standardButtons.onVersionChanged,
	    standardButtons.getVersion
	),
	menu;

    queryString.param(
	"debug",
	backend.setDebug,
	function() {
	    return backend.isDebugging() ? true : null;
	}
    );

    return {
	backend: backend,
	store: store,
	queryString: queryString,
	standard: standardButtons,
	spec: buttonSpec,
	buildMenu: function(container, buttons, excludeStandardButtons) {
	    var menuContainer = menuContainerFactory(container, helpURL);

	    buttons = excludeStandardButtons ? buttons : standardButtons.buttonSpec().concat(buttons);
	    
	    menu = menuContentsFactory(
		menuContainer,
		buttons,
		standardButtons.getTitle,
		menuState
	    );
	},
	
	menu: function() {
	    return menu;
	}
    };
};

