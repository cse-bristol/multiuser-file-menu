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
module.exports = function(standardButtons, collection) {
    var fromURL = function() {
	var query = URL.parse(window.location.href, true).query;

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
		window.history.pushState(null, "", URL.format(url));
		
		document.title = name
		    + (isNum(version) ? " v" + version : "")
		    + " - " + collection;
	    }
	    
	} else {
	    delete query.name;
	    url.search = null;
	    window.history.pushState(null, "", URL.format(url));
	    document.title = "Untitled " + " - " + collection;	    
	}
    };

    d3.select(window).on("popstate", fromURL);
    
    standardButtons.onNew(toURL);
    standardButtons.onOpen(toURL);
    standardButtons.onSaveAs(toURL);
    
    fromURL();
};
