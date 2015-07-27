"use strict";

/*global module, require, setTimeout*/

var d3 = require("d3"),
    pointerEvents = "pointer-events";

/*
 Tests if the current document is inside an iframe. 

 If it is, then any scroll events on the parent document will temporarily disable all pointer events for that iframe.

 Pointer events will be restored 500ms after the most recent scroll event.

 Compatible with standards-compliant browsers and Internet Explorer 9+ (due to use of addEventListener).
 */
module.exports = function() {
    if (window.frameElement && window.parent) {
	var disable = 0,
	    iframe = window.frameElement;
	
	window.parent.addEventListener("scroll", function() {
	    if (!iframe) {
		return;
	    }

	    if (disable === 0) {
		d3.select(iframe)
		    .style(pointerEvents, "none");
	    }
	    
	    disable++;
	    
	    setTimeout(
		function() {
		    if (disable > 0) {
			disable--;
		    }

		    if (!iframe) {
			return;
		    }

		    if (disable === 0) {
			d3.select(iframe)
			    .style(pointerEvents, "auto");
		    }
		},
		500
	    );
	});
    }
};
