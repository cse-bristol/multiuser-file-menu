"use strict";

/*global module, require*/

var d3 = require("d3"),
    helpers = require("./helpers.js"),
    guid = helpers.guid,
    callbacks = helpers.callbackHandler;

/*
 Provides a set of pre-specified buttons: New, Open, Save as, and Delete.

 Provides callbacks for these buttons.

 Keeps track of the document title, and whether or not it is a temporary title.
 */
module.exports = function() {
    var title = null,
	temp = false,
	onTitleChange = callbacks(),
    	onNew = callbacks(),
	onOpen = callbacks(),
	onSaveAs = callbacks(),
	onDelete = callbacks(),

	setTitle = function(newTitle, newTemp) {
	    if (temp) {
		onDelete(title);
	    }
	    title = newTitle;
	    temp = newTemp;
	    onTitleChange(title);
	},
	
	newDoc = function() {
	    setTitle(guid(), true);
	    onNew(title);
	},

	open = function(name) {
	    setTitle(name, false);
	    onOpen(name);
	};

    var standardButtons = [
	{
	    text: "New",
	    f: newDoc,
	    onlineOnly: false
	},
	
	{
	    text: "Open",
	    search: {},
	    f: open,
	    onlineOnly: true
	},

	{
	    text: "Save as",
	    search: {
		alwaysIncludeSearchText: true,
		forbidEmpty: true
	    },
	    f: function(result) {
		if (title === result) {
		    return;
		}
		
		setTitle(result, false);
		onSaveAs(result);
	    },
	    onlineOnly: true
	},

	{
	    text: "Delete",
	    search: {},
	    f: function(result) {
		if (result === title) {
		    setTitle(guid(), true);
		    onNew(title);
		}		
		onDelete(result);
	    },
	    onlineOnly: true
	}
    ];

    return {
	buttonSpec: function() {
	    return standardButtons;
	},
	
	setTitle: setTitle,
	getTitle: function() {
	    return title;
	},
	onTitleChange: onTitleChange.add,
	
	newDoc: newDoc,
	onNew: onNew.add,
	
	open: open,
	onOpen: onOpen.add,
	
	onSaveAs: onSaveAs.add,
	onDelete: onDelete.add
    };
};
