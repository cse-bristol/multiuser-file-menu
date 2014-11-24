"use strict";

/*global module, require*/

module.exports = function() {
    
    
    return {
	add: function(text, f, onlineOnly, hooks) {
	    return {
		text: text,
		f: f,
		onlineOnly: onlineOnly,
		hooks: hooks
	    };
	},

	done: function() {
	}
    };
};
