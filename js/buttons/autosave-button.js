"use strict";

/*global module, require*/

var online = {
    online: true,
    offline: false
};

module.exports = function(store, specifyButton, menuBar) {
    var setAutosave = function(value) {
	if (value) {
		/*
		 Sync the document before listening to changes.
		 */
	    store.saveDocument(store.getTitle());
	}
	store.setAutosave(value);
	indicator.classed("enabled", value);
    },

    indicator = menuBar.append("div")
	    .attr("id", "autosave-indicator")
	    .classed("menu-item", true)
	    .text("Auto Engaged")
	    .on("click", setAutosave);

    indicator.append("span")
	.text("X");

    return specifyButton(
	"Auto",
	function(menuState) {
	    return store.getAutosave();
	},
	function(wasActive) {
	    setAutosave(!wasActive);
	},
	{
	    onlineOffline: online,
	    readWriteSync: {
		untitled: false,
		read: false,
		write: true,
		sync: true
	    }
	}
    );
};
