"use strict";

/*global module, require*/

var _ = require("lodash"),
    d3 = require("d3"),
    URL = require("url"),
    helpers = require("./helpers.js"),
    isNum = helpers.isNum;

/*
 Updates the query string as documents are loaded.

 When the web page is loaded, loads the document from the name field of the query string.  
 */
module.exports = function(collection, store) {
    var url,
	params = d3.map(),

	/*
	 Prevent fromURL from immediately triggering toURL and making a superfluous history entry.
	 */
	reading = false,

	parseURL = function() {
	    url = URL.parse(window.location.href, true);
	},

	changed = function(newURL) {
	    return !_.isEqual(url.query, newURL.query);
	},

	/*
	 Add an entry to the browser's back button on any navigation action.

	 If we're inside an iframe, we don't make any history changes. Instead, message the parent window.
	 */
	addHistory = function(newURL) {
	    var formattedURL = URL.format(newURL);
	    
	    if (window === window.parent) {
		window.history.pushState(null, "", formattedURL);
	    } else {
		window.parent.postMessage(
		    {
			type: "iframe-state-change",
			url: formattedURL
		    },
		    "*"
		);
	    }
	    
	    url = newURL;
	},
	
	fromURL = function() {
	    parseURL();

	    reading = true;
	    if (url.query.name) {
		var title = decodeURIComponent(url.query.name),
		    version = url.query.v ? decodeURIComponent(url.query.v) : null;

		store.openDocument(title, version);
		document.title = title;
	    } else {
		store.newDocument();
	    }
	    reading = false;

	    params.forEach(function(key, value) {
		if (value.read) {
		    var queryVal = url.query[key];

		    value.read(
			queryVal ? decodeURIComponent(queryVal) : null
		    );
		}
	    });
	};

    var toURL = function() {
	if (reading) {
	    return;
	}
	
	if (!url) {
	    parseURL();
	}

	var newURL = {
	    // href should be derived from the other properties.
	    href: null,
	    protocol: url.protocol,
	    slashes: url.slashes,
	    auth: url.auth,
	    hostname: url.hostname,
	    port: url.port,
	    host: url.host,
	    pathname: url.pathname,
	    // Search should be derived from query.
	    search: null,
	    query: {},
	    hash: url.hash
	},
	    name = store.getTitle(),
	    version = store.getVersion();

	if (name) {
	    newURL.query.name = name;

	    if (isNum(version)) {
		newURL.query.v = version;
	    }
	}

	params.forEach(function(key, value) {
	    if (value.write) {
		var queryVal = value.write();

		if (queryVal !== null && queryVal !== undefined) {
		    newURL.query[key] = encodeURIComponent(queryVal);
		}
	    }
	});

	if (changed(newURL)) {
	    addHistory(newURL);

	    if (name) {
		document.title = name
		    + (isNum(version) ? " v" + version : "")
		    + " - " + collection;
	    } else {
		document.title = "Untitled " + " - " + collection;	    
	    }
	}
    };

    d3.select(window).on("popstate", function() {
	fromURL.apply(this, arguments);
    });

    store.onNavigate(toURL);

    return {
	/*
	 Loads a document or creates a new one based on the current URL.
	 */
	fromURL: fromURL,

	/*
	 Turns the current state of the document into a URL.

	 Possibly adds it to history (see cameFromURL above).
	 */
	toURL: toURL,
	
	/*
	 Looks up and decodes a parameter from the query parsed during the last fromURL or toURL call.
	 */
	readParameter: function(param) {
	    if (!url.query || url.query[param] === undefined || url.query[param] === null) {
		return null;
	    } else {
		return decodeURIComponent(url.query[param]);
	    }
	},

	/*
	 Hook in some extra custom query-string behaviour.

	 + param is the name of the query string param
	 + readFunction is an optional function which will be called if the param was present in the query string. This will happen after loading the document.
	 + writeFunction is an optional function which will be called from toURL triggers. It should return a value, which will be url encoded and added to the query string.

	 If a query string has no value for a parameter, readFunction will be called with 'null' (this gives us an opportunity to unset things).
	 If writeFunction returns null or undefined, that value will not be written to the query string.
	 */
	param: function(param, readFunction, writeFunction) {
	    params.set(param, {
		read: readFunction,
		write: writeFunction
	    });
	}
    };
};
