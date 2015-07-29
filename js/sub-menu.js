"use strict";

/*global module, require*/

var disableTimeout = 1000;

/*
 A sub-menu is a div which can be enabled or disabled.

 It is disabled by:
 + Not being enabled for <timeout> milliseconds
 + The button it belongs to being clicked on while the sub-menu is enabled.

 It is enabled by:
 + Being mouse-hovered over.
 + The button is belongs to being hovered over.
 + The button it belongs to being clicked on while the sub-menu is disabled.
 */
module.exports = function() {
    var lastEnabled = null,

	onExit,
	
	wrapper,
	menu,

	maybeDisableLater = function() {
	    window.setTimeout(
		function() {
		    if (!lastEnabled) {
			return;
		    }
		    
		    if (new Date().getTime() - lastEnabled > disableTimeout) {
			disable();
		    }
		},
		disableTimeout
	    );
	},

	disable = function() {
	    lastEnabled = null;

	    if (menu) {
		menu.classed("enabled", false);

		if (onExit) {
		    onExit();
		}
	    }
	},

	maintain = function() {
	    lastEnabled = new Date().getTime();	    
	},

	enable = function() {
	    if (menu) {
		menu.classed("enabled", true);
	    }

	    maintain();
 	};

    return {
	init: function(buttonElement) {
	    wrapper = buttonElement.append("div")
		.classed("sub-menu-wrapper", true);

	    menu = wrapper.append("div")
		.classed("sub-menu", true);

	    buttonElement
		.on("mousemove", maintain)
		.on("mouseleave", maybeDisableLater);

	    menu
		.on("mousemove", maintain)
		.on("mouseleave", maybeDisableLater);

	    return menu;
	},

	startProcess: function(buttonElement, onProcessEnd) {
	    onExit = onProcessEnd;
	    enable();
	    return {
		button: buttonElement,
		exit: function() {
		    onExit = null;
		    disable();
		}
	    };
	},

	isEnabled: function() {
	    return !!lastEnabled;
	}
    };
};
