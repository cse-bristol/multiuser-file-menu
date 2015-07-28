"use strict";

/*global module, require*/

var matchNone = /(?!)/,
    matchEmpty = /$^/,

    /*
     Disabled means the button is not clickable.
     Ready means the button may be cliced.
     Active means the button has been clicked. It may be showing a search, a dialogue, or a sub-menu.
     */
    disabled = "disabled",
    ready = 'ready',
    active = "active";

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
		untitled: true,
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

    var m =  {
	matchEmpty: matchEmpty,

	/*
	 text is required, and should be a string. It's the text which will be displayed on the button.

	 f is required, and should be a function. If search is specified, then f will be called once a search result is clicked and will get the text of the search result as an argument. Otherwise, it will be called with no arguments as soon as the button is clicked.

	 options is required, and may contain the following optional properties, plus those listed in the checkStates function above:

	 options.extraDisplayCondition is a function which must return true in order for the button to be displayed.

	 options.element is a string which represents the type of HTML element to be used for this button.

	 options.hooks is a function which takes a d3 selection. The d3 selection will be the button. Hooks can be used to modify the button. If not specified, it will default to a noop function.
	 */
	button: function(text, isActive, f, options) {
	    if (typeof(text) !== 'string') {
		throw new Error("Text should be a string, was: " + text);
	    }

	    if (typeof(f) !== 'function') {
		throw new Error('f should be a function, was: ' + f);
	    }

	    checkStates(options);

	    if (options.extraDisplayCondition === undefined) {
		options.extraDisplayCondition = function() {
		    return true;
		};
	    } else if (typeof(options.extraDisplayCondition) !== 'function') {
		throw new Error("If extraDisplayCondition is specified, it must be a function which returns true or false, was " + options.extraDisplayCondition);
	    }

	    if (options.element === undefined) {
		options.element = "div";
	    } else if (typeof(options.element) !== 'string') {
		throw new Error("If element is specified, it must be a string which is the name of an HTML element, was " + options.element);
	    }
		

	    if (options.hooks === undefined) {
		options.hooks = function() {
		    // no-op
		};
		
	    } else if (typeof(options.hooks) !== 'function') {
		throw new Error("If hooks is specified, it must be a function, was: " + options.hooks);
	    }

	    return {
		text: text,
		f: f,
		element: options.element,
		getState: function(menuState, ownsCurrentProcess) {
		    if (
			options.onlineOffline[menuState.online() ? "online" : "offline"]
			    && options.readWriteSync[menuState.readWriteSync()]
			    && options.embeddedStandalone[menuState.embedded() ? "embedded" : "standalone"]
			    && options.extraDisplayCondition()
		    ) {
			if (isActive && isActive(menuState, ownsCurrentProcess)) {
			    return active;
			} else {
			    return ready;
			}
			
		    } else {
			return disabled;
		    }
		},
		hooks: options.hooks
	    };
	}
    };

    return m;
};
