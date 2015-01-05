"use strict";

/*global module, require*/

var helpers = require("./helpers.js"),
    callbacks = helpers.callbackHandler;


module.exports = function(onUp, onDown, isUp) {
    var onChange = callbacks();

    onUp(onChange);
    onDown(onChange);
    
    var m = {
	online: function() {
	    return isUp();
	},

	embedded: function() {
	    try {
		return window.self !== window.top;
	    } catch (e) {
		return true;
	    }
	},

	readOnly: function() {
	    return true;
	},

	sync: function() {
	    return false;
	},

	/*
	 The values returned by the helper method should match up with the readWriteSync values used by specify-buttons.js.
	 */
	readWriteSync: function() {
	    if (m.readOnly()) {
		return "read";
	    } else if (m.sync()) {
		return "sync";
	    } else {
		return "write";
	    }
	},

	onChange: onChange.add
	
    };

    return m;
};
