"use strict";

/*global module, require*/

var helpers = require("./helpers.js"),
    callbacks = helpers.callbackHandler;

module.exports = function(onUp, onDown, isUp, onAutoSaveChanged, autoSave, onTitleChanged, getTitle) {
    var onChange = callbacks();

    onUp(onChange);
    onDown(onChange);
    onAutoSaveChanged(onChange);
    onTitleChanged(onChange);
    
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

	/*
	 Documents which don't have a title are considered read only.

	 TODO: documents for which the user does not have write permissions.

	 TODO: historical versions.
	 */
	readOnly: function() {
	    return !getTitle();
	},

	sync: function() {
	    return autoSave();
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
