"use strict";

/*global module, require*/

var d3 = require("d3"),
    URL = require("url"),
    helpers = require("./helpers.js"),
    isNum = helpers.isNum;

/*
 Updates the query string as documents are loaded.

 When the web page is loaded, loads the document from the name field of the query string.  
 */
module.exports = function(standardButtons, collection, debug) {
    var cameFromURL = true,

	/*
	 Add an entry to the browser's back button on any navigation action.

	 Will not add history if we just loaded the page from the URL bar, by clicking a link in another web page, or by pressing the back button.
	 */
	addHistory = function(url) {
	    if (cameFromURL) {
		cameFromURL = false;
	    } else {
		window.history.pushState(null, "", URL.format(url));
	    }
	},
    
	fromURL = function() {
	var query = URL.parse(window.location.href, true).query;

	if (query.debug) {
	    debug();
	}
	
	if (query.name) {
	    var title = decodeURIComponent(query.name),
		version = query.v ? decodeURIComponent(query.v) : null;
	    
	    standardButtons.open(title, version);
	    document.title = title;
	} else {
	    standardButtons.newDoc();
	}
    };

    var toURL = function(name, version) {
	var url = URL.parse(window.location.href, true),
	    query = url.query;

	if (name) {

	    var encodedName = encodeURIComponent(name),
		encodedVersion = isNum(version) ? encodeURIComponent(version) : null;

	    if (!(
		encodedName === query.name &&
		    encodedVersion === query.version
	    )) {
		
		query.name = encodedName;
		
		if (isNum(version)) {
		    query.v = encodedVersion;
		} else {
		    delete query.v;
		}
		
		url.search = null;
		addHistory(url);
		
		document.title = name
		    + (isNum(version) ? " v" + version : "")
		    + " - " + collection;
	    }
	    
	} else {
	    delete query.name;
	    delete query.v;	    
	    url.search = null;
	    addHistory(url);
	    document.title = "Untitled " + " - " + collection;	    
	}
    };

    d3.select(window).on("popstate", function() {
	cameFromURL = true;
	fromURL.apply(this, arguments);
    });
        
    standardButtons.onNew(toURL);
    standardButtons.onOpen(toURL);
    standardButtons.onSaveAs(toURL);

    return {
	fromURL: fromURL,
	toURL: toURL
    };
};
