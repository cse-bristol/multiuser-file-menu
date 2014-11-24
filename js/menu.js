"use strict";

/*global module, require*/

var d3 = require("d3"),
    search = require("./search.js"),
    helpers = require("./helpers.js"),
    guid = helpers.guid,
    callbacks = helpers.callbackHandler;

/*
 Provides UI buttons to manage documents.
 */
module.exports = function(container, searchFunction, onUp, onDown, isUp) {
    var title = null,
	temp = false,
	lastSearch = null,
	activeButton = null,
	onNew = callbacks(),
	onOpen = callbacks(),
	onSaveAs = callbacks(),
	onInsert = callbacks(),
	onDelete = callbacks(),
	jsonExport;

    var setTitle = function(newTitle, newTemp) {
	if (temp) {
	    onDelete(title);
	}
	title = newTitle;
	temp = newTemp;
	jsonExport.attr("download", title + ".json");
    };

    var clearActive = function() {
	if (activeButton) {
	    activeButton.classed("active", false);
	    activeButton = null;
	}
    };

    var hideSearch = function() {
	if (lastSearch) {
	    lastSearch.hide();
	    lastSearch = null;
	}
    };
    
    var enable = function() {
	container.classed("offline", false);
    };

    var disable = function() {
	hideSearch();
	clearActive();

	container.classed("offline", true);
    };

    /*
     Run a search, then execute a command once a search item is clicked.
     
     The clicked button will be highlighted while this is going on.
     */
    var withSearch = function(alwaysIncludeSearchText, forbidEmpty, callback) {
	return function(button) {
	    hideSearch();
	    clearActive();
	    activeButton = button;
	    activeButton.classed("active", true);
	    
	    lastSearch = search(
		container,
		searchFunction,
		alwaysIncludeSearchText,
		forbidEmpty,
		title,
		function() {
		    clearActive();
		    callback.apply(this, arguments);
		},
		clearActive
	    );
	};
    };

    var newDoc = function() {
	setTitle(guid(), true);
	onNew(title);
    };

    var open = function(name) {
	setTitle(name, false);
	onOpen(name);
    };
    
    var buttonSpec = [
	{
	    text: "New",
	    f: newDoc,
	    onlineOnly: false
	},
	
	{
	    text: "Open",
	    f: withSearch(false, false, open),
	    onlineOnly: true
	},

	{
	    text: "Save as",
	    f: withSearch(true, true, function(result) {
		setTitle(result, false);
		onSaveAs(result);
	    }),
	    onlineOnly: true
	},

	{
	    text: "Insert",
	    f: withSearch(false, false, function(result) {
		onInsert(result);
	    }),
	    onlineOnly: true
	},

	{
	    text: "Delete",
	    f: withSearch(false, false, function(result) {
		if (result === title) {
		    setTitle(guid(), true);
		    onNew(title);
		}		
		onDelete(result);
	    }),
	    onlineOnly: true
	},

	{
	    text: "Export",
	    f: function() {
		d3.event.preventDefault();
		d3.event.stopPropagation();
	    },
	    onlineOnly: false
	}
    ];

    var buttons = container.selectAll("div.document-control-button")
	.data(buttonSpec)
	.enter()
	    .append("div")
    	.classed("document-control-item", true)
	.classed("document-control-button", true)
	.text(function(d, i) {
	    return d.text;
	})
	.classed("online-only", function(d, i) {
	    return d.onlineOnly;
	})
	.on("click", function(d, i) {
	    d.f(d3.select(this));
	});

    jsonExport = buttons.filter(function(d, i) {
	return d.text === "Export";
    });

    container.append("div")
	.classed("offline-only", true)
        .classed("document-control-item", true)
	.text("Offline");

    onUp(enable);
    onDown(disable);
    if (isUp()) {
	enable();
    } else {
	disable();
    }

    return {
	newDoc: newDoc,
	onNew: onNew.add,
	open: open,
	onOpen: onOpen.add,
	onSaveAs: onSaveAs.add,
	onInsert: onInsert.add,
	onDelete: onDelete.add,
	updateExportLink: function(val) {
	    jsonExport.attr("href", val);
	}
    };
};
