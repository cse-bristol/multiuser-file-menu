"use strict";

/*global module, require*/

var matchNone = /(?!)/,
    matchEmpty = /$^/;

/*
 Helper functions for producing valid button specifications. We pass these to the menu object, which display them for us.

 The reason for these functions is to provide defaults for the optional arguments, and to check the types of things supplied by the user.
 */
module.exports = function(defaultCollection) {
    var checkState = function(o, props) {
	props.forEach(function(p) {
	    if (o[p] === undefined) {
		throw new Error("Missing property " + p + " had " + Object.keys(o));
	    }

	    if (typeof(o[p]) !== 'boolean') {
		throw new Error("Property " + p + " should be a boolean, was: " + o[p]);
	    }
	});
    };

    /*
     states should be an object.

     We are checking for 3 properties: onlineOffline, readWriteSync and embeddedStandalone. Each of these represents a dimension of the state-space of the menu. If any are missing, the button will be displayed regardless of the state of the dimension.

     Each of these should be a subobject containing true/false sub-properties detailing which states the button should display in.
     */    
    var checkStates = function(states) {
	if (!states.onlineOffline) {
	    states.onlineOffline = {
		online: true,
		offline: true
	    };
	} else {
	    checkState(states.onlineOffline, ['online', 'offline']);
	}

	if (!states.readWriteSync) {
	    states.readWriteSync = {
		read: true,
		write: true,
		sync: true
	    };
	} else {
	    checkState(states.readWriteSync, ['read', 'write', 'sync']);
	}

	if (!states.embeddedStandalone) {
	    states.embeddedStandalone = {
		embedded: true,
		standalone: true
	    };
	} else {
	    checkState(states.embeddedStandalone, ['embedded', 'standalone']);
	}
    };

    /*
     Produces a search object to be passed to the button. When this button is clicked, it will produce a search box.

     Takes an options object with the following properties:

     collection is optional, and should be a string. This is the Mongo collection which this search will look in. If not specified, we'll use the default collection instead.

     excludeTerms is optional, and should be a regex. If this is specified, any search terms the user types which match that regex will not trigger a search

     includeSearchTerm is optional, and should be a boolean. If this is specified, the search term will always be included in the results, even if it wasn't found in the search. In this case, it will get a different CSS class (.search-result-fabricated) added to it.
     */
    var checkSearch = function(options) {
	if (!options.collection) {
	    options.collection = defaultCollection;
	} else if (typeof(options.collection) !== "string") {
	    throw new Error("If collection is specified, it should be a string, was: " + options.collection);
	}

	if (!options.excludeTerms) {
	    options.excludeTerms = matchNone;
	    
	} else if (!options.excludeTerms.test) {
	    throw new Error("If excludeTerms is specified, it should be a regex, was: " + options.excludeTerms);
	}

	if (!options.includeSearchTerm) {
	    options.includeSearchTerm = false;
	    
	} else if (typeof(options.includeSearchTerm) !== "boolean") {
	    throw new Error("If includeSearchTerm is specified, it should be a boolean, was: " + options.includeSearchTerm);
	}
    };
    
    return {
	matchEmpty: matchEmpty,

	/*
	 text is required, and should be a string. It's the text which will be displayed on the button.

	 f is required, and should be a function. If search is specified, then f will be called once a search result is clicked and will get the text of the search result as an argument. Otherwise, it will be called with no arguments as soon as the button is clicked.

	 options is reqyured, and may contain the following optional properties, plus those listed in the checkStates function above:

	 options.search is optional, and should be created using the search() function above. If it is present, then the button will pop up a search box when it is clicked.

	 options.hooks is optional, and should be a function which takes a d3 selection. The d3 selection will be the button. Hooks can be used to modify the button. If not specified, it will default to a noop function.

	 options.element is optional, and should be the name of an html element to use. If not specified, it will default to a div.
	 */
	button: function(text, f, options) {
	    if (!typeof(text) === 'string') {
		throw new Error("Text should be a string, was: " + text);
	    }

	    if (!typeof(f) === 'function') {
		throw new Error('f should be a function, was: ' + f);
	    }

	    checkStates(options);

	    if (options.search) {
		checkSearch(options.search);
	    }

	    if (options.hooks === undefined) {
		options.hooks = function() {
		    // no-op
		};
		
	    } else if (typeof(options.hooks) !== 'function') {
		throw new Error("If hooks is specified, it must be a function, was: " + options.hooks);
	    }

	    if (options.element === undefined) {
		options.element = "div";
		
	    } else if (typeof(options.element) !== 'string') {
		throw new Error("If element is specified, it must be a string, was: " + options.element);
	    }
	    
	    return {
		text: text,
		f: f,
		onlineOffline: options.onlineOffline,
		readWriteSync: options.readWriteSync,
		embeddedStandalone: options.embeddedStandalone,
		search: options.search,
		hooks: options.hooks,
		element: options.element
	    };
	}
    };
};
