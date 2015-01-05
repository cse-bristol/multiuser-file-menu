"use strict";

/*global module, require*/

var d3 = require("d3"),
    URL = require("url");

/*
 Updates the query string as documents are loaded.

 When the web page is loaded, loads the document from the name field of the query string.  

 TODO: once we have history, include the reivion number in here.
 */
module.exports = function(standardButtons, collection) {
    var fromURL = function() {
	var query = URL.parse(window.location.href, true).query;

	if (query.name) {
	    var title = decodeURIComponent(query.name);
	    standardButtons.open(title);
	    document.title = title;
	} else {
	    standardButtons.newDoc();
	}
    };

    var toURL = function(name) {
	var url = URL.parse(window.location.href, true),
	    query = url.query;

	if (name) {

	    var encodedName = encodeURIComponent(name);

	    if (encodedName !== query.name) {
		query.name = encodedName;
		url.search = null;
		window.history.pushState(null, "", URL.format(url));
		document.title = name + " - " + collection;
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
