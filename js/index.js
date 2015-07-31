"use strict";

/*global module, require*/

var iframeNoScroll = require("./iframe-noscroll"),
    backendFactory = require("./backend.js"),
    storeFactory = require("./store.js"),
    queryStringFactory = require("./query-string.js"),
    menuStateFactory = require("./menu-state.js"),
    menuContainerFactory = require("./menu-container.js"),
    menuContentsFactory = require("./menu-contents.js"),        
    buttonSpecFactory = require("./buttons/specify-buttons.js"),
    standardButtonFactory = require("./buttons/standard-buttons.js"),

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

module.exports = function(collection, friendlyName, serialize, deserialize, getModel, setModel, freshModel, url, helpURL) {
    var embedded = isEmbedded();

    if (embedded) {
	iframeNoScroll();
    }
    
    var backend = backendFactory(!embedded, url ? url : defaultUrl),
	buttonSpec = buttonSpecFactory(collection),

	store = storeFactory(!embedded, collection, backend, serialize, deserialize, getModel, setModel, freshModel),
	queryString = queryStringFactory(
	    collection,
	    store
	),
	menuState = menuStateFactory(
	    embedded,
	    backend.onUp, backend.onDown, backend.isUp,
	    store.getAutosave, store.onAutosaveChanged, 
	    store.getTitle, store.getVersion, store.onNavigate
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
	spec: buttonSpec,
	buildMenu: function(container) {
	    var menuContainer = menuContainerFactory(container, helpURL);
	    menu = menuContentsFactory(
		menuContainer,
		store.getTitle,
		menuState
	    );
	    
	    var standardButtons = standardButtonFactory(
		buttonSpec,
		store,
		backend.search,
		menuContainer,
		collection,
		friendlyName
	    );
	    
	    return {
		standardButtons: standardButtons,
		setButtons: function(buttons, excludeStandardButtons) {
		    menu.setButtons(
			excludeStandardButtons ? buttons : standardButtons.concat(buttons)
		    );
		}
	    };
	},
	
	menu: function() {
	    return menu;
	}
    };
};

