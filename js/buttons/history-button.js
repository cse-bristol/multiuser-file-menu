"use strict";

/*global module, require*/

var d3 = require("d3"),
    subMenuFactory = require("./processes/sub-menu.js"),

    online = {
	online: true,
	offline: false
    },

    standalone = {
	embedded: false,
	standalone: true
    }; 

module.exports = function(store, specifyButton) {
    var historySubMenu = subMenuFactory(),
	historyContent,
	updateHistoryControls = function(versionsList) {
	    if (historyContent) {
		var versionEntries = historyContent
			.selectAll(".version-entry")
			.data(
			    versionsList
			);

		versionEntries.exit().remove();

		versionEntries.enter()
		    .append("div")
		    .classed("version-entry", true)
		    .text(function(d, i) {
			return new Date(
			    parseInt(d.ts)
			)
			    .toLocaleString();
		    })
		    .on("click", function(d, i) {
			d3.event.stopPropagation();

			store.openDocument(
			    store.getTitle(),
			    d.v === store.getVersion() ?
				null :
				d.v
			);
		    });

		versionEntries.classed("current-version", function(d, i) {
		    return d.v === store.getVersion();
		});

		versionEntries.order();
	    }
	},
	historyButton = specifyButton(
	    "History",
	    function(menuState, ownsCurrentProcess) {
		return historySubMenu.isEnabled();
	    },
	    function(wasActive, currentTitle, buttonElement, onProcessEnd) {
		if (!wasActive) {
		    return historySubMenu.startProcess(buttonElement, onProcessEnd);
		} else {
		    return null;
		}
	    },
	    {
		hover: true,
		onlineOffline: online,
		readWriteSync: {
		    untitled: false,
		    read: true,
		    write: true,
		    sync: true
		},		
		embeddedStandalone: standalone,
		hooks: function(buttonElement) {
		    historyContent = historySubMenu.init(buttonElement);
		}
	    }
	);
    
    store.onVersionsListUpdated(function(documentName, versionsList) {
	if (documentName === store.getTitle()) {
	    updateHistoryControls(versionsList);
	}	
    });

    return historyButton;
};
