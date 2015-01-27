"use strict";

/*global module, require*/

var helpers = require("./helpers.js"),
    isNum = helpers.isNum,
    callbacks = helpers.callbackHandler;

module.exports = function(
    onUp, onDown, isUp,
    onAutoSaveChanged, autoSave,
    onTitleChanged, getTitle,
    onVersionChanged, getVersion
) {
    var onChange = callbacks();

    onUp(onChange);
    onDown(onChange);
    onAutoSaveChanged(onChange);
    onTitleChanged(onChange);
    onVersionChanged(onChange);
    
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
	 TODO: documents for which the user does not have write permissions.
	 */
	readOnly: function() {
	    return (
		m.untitled() ||
		    // Historical versions
		    isNum(getVersion())
	    );
	},

	untitled: function() {
	    // Document created using the 'new' button
	    return !getTitle();
	},

	sync: function() {
	    return autoSave();
	},

	/*
	 The values returned by the helper method should match up with the readWriteSync values used by specify-buttons.js.
	 */
	readWriteSync: function() {
	    if (m.untitled()) {
		return "untitled";
	    } else if (m.readOnly()) {
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
