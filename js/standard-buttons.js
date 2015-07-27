"use strict";

/*global module, require*/

var d3 = require("d3"),
    _ = require("lodash"),
    helpers = require("./helpers.js"),
    isNum = helpers.isNum,
    callbacks = helpers.callbackHandler,

    online = {
	online: true,
	offline: false
    },

    standalone = {
	embedded: false,
	standalone: true
    }; 

/*
 Provides a set of pre-specified buttons: New, Open, Save as, and Delete.

 Provides callbacks for these buttons.

 Keeps track of the document title, and whether or not it is a temporary title.
 */
module.exports = function(spec) {
    var title = null,
	onTitleChange = callbacks(),
	version,
	onVersionChanged = callbacks(),
    	onNew = callbacks(),
	onOpen = callbacks(),
	onSaveAs = callbacks(),
	onDelete = callbacks(),
	onAutoSaveChange = callbacks(),

	historySlider,
	historyNumber,

	setTitle = function(newTitle) {
	    title = newTitle;
	    onTitleChange(title);
	},
	
	newDoc = function() {
	    setTitle(null);
	    onNew();
	},

	open = function(name, version) {
	    setTitle(name);
	    onOpen(name, version);
	},

	offlineIndicator = spec.button(
	    "Connecting",
	    function() {
		// Noop
	    },
	    {
		onlineOffline: {
		    online: false,
		    offline: true
		},
		embeddedStandalone: standalone,
		confirm: false,
		hooks: function(el) {
		    el.attr("id", "offline-indicator")
			.classed("active", true)
			.style("width", "8em");
		}
	    }
	),

	newButton = spec.button(
	    "New",
	    newDoc,
	    {
		embeddedStandalone: standalone
	    }
	),

	openButton = spec.button(
	    "Open",
	    open,
	    {
		onlineOffline: online,
		embeddedStandalone: standalone,
		search: {}
	    }
	),

	historyButtons = spec.toggle(
	    "History",
	    /*
	     We don't need a discriminator function here: we know which button to display based on read/write status instead.
	     */
	    null,
	    function() {
		version = historySlider.node().value;
		onOpen(title, version);
	    },
	    {
		onlineOffline: online,
		readWriteSync: {
		    untitled: false,
		    read: false,
		    write: true,
		    sync: true
		},		
		embeddedStandalone: standalone
	    },
	    function() {
		version = null;
		onOpen(title, version);
	    },
	    {
		onlineOffline: online,
		readWriteSync: {
		    untitled: false,
		    read: true,
		    write: false,
		    sync: false
		},			
		embeddedStandalone: standalone,
		hooks: function(el) {
		    var delayedOpen = _.debounce(
			function(val) {
			    onOpen(title, val);
			},
			200
		    );
		    
		    historySlider = el.append("input")
			.attr("id", "history-slider")
			.attr("type", "range")
			.attr("min", 0)
			.on("input", function(d, i) {
			    historyNumber.node().value = this.value;			    
			    delayedOpen(this.value);
			})
			.on("click", function(d, i) {
			    // Stop the history button from toggling.
			    d3.event.stopPropagation();
			});

		    historyNumber = el.append("input")
			.attr("type", "number")
			.attr("id", "history-number")			    
			.attr("min", 0)
			.on("input", function(d, i) {
			    historySlider.node().value = this.value;
			    delayedOpen(this.value);
			})
			.on("click", function(d, i) {
			    // Stop the history button from toggling.
			    d3.event.stopPropagation();
			});
		}
	    }
	),

	autosaveButtons = spec.toggle(
	    "Auto",
	    /*
	    No discriminator function needed here because we already know whether to toggle based on sync status.
	    */
	    null,
	    function() {
		/*
		 Sync the document, then listen to further changes.
		 */
		onSaveAs(title);
		onAutoSaveChange(true);
	    },
	    {
		onlineOffline: online,
		readWriteSync: {
		    untitled: false,
		    read: false,
		    write: true,
		    sync: false
		}
	    },

	    function() {
		onAutoSaveChange(false);
	    },
	    {
		onlineOffline: online,
		readWriteSync: {
		    untitled: false,
		    read: false,
		    write: false,
		    sync: true
		}
	    }
	),

	deleteButton = spec.button(
	    "Delete",
	    function(result) {
		if (result === title) {
		    setTitle(null);
		    onNew();
		}		
		onDelete(result);
	    },
	    {
		onlineOffline: online,
		embeddedStandalone: standalone,
		search: {}
	    }
	),

	saveButton = spec.button(
	    "Save",
	    function() {
		onSaveAs(title);
	    },
	    {
		onlineOffline: online,
		readWriteSync: {
		    untitle: false,
		    read: false,
		    write: true,
		    sync: false
		}
	    }
	),
	
	saveAsButton = spec.button(
	    "Save as",
	    function(result) {
		if (title === result) {
		    return;
		}
		
		setTitle(result, false);
		onSaveAs(result);
	    },
	    {
		onlineOffline: online,
		embeddedStandalone: standalone,
		search: {
		    excludeTerms: spec.matchEmpty,
		    includeSearchTerm: true
		}
	    }
	),

	popOutButton = spec.button(
	    "Pop Out",
	    function() {
		window.open(document.location, "_blank");
	    },
	    {
		embeddedStandalone: {
		    embedded: true,
		    standalone: false
		}
	    }
	),

	standardButtons = [
	    offlineIndicator,
	    popOutButton,
	    newButton,
	    openButton,
	    saveButton,
	    saveAsButton,

	    autosaveButtons[0],
	    autosaveButtons[1],	    

	    historyButtons[0],
	    historyButtons[1],

	    deleteButton
	];

    var m =  {
	buttonSpec: function() {
	    return standardButtons;
	},
	
	setTitle: setTitle,
	getTitle: function() {
	    return title;
	},
	onTitleChange: onTitleChange.add,
	
	newDoc: newDoc,
	onNew: onNew.add,
	
	open: open,
	onOpen: onOpen.add,
	
	onSaveAs: onSaveAs.add,
	onDelete: onDelete.add,

	onAutoSaveChange: onAutoSaveChange.add,

	setVersion: function(v, maxV) {
	    if (isNum(maxV)) {
		if (!isNum(historySlider.attr("max"))) {
		    m.setVersion(maxV);
		}
		
		historySlider.attr("max", maxV);
		historyNumber.attr("max", maxV);

		if (historySlider.node().value > maxV) {
		    historySlider.node().value = maxV;
		    historyNumber.node().value = maxV;
		}
	    }
	    
	    if (v !== version) {
		if (isNum(v)) {
		    version = v;
		    historySlider.node().value = v;
		    historyNumber.node().value = v;
		    historyNumber.classed("erroneous-version", false);		
		} else {
		    version = null;
		}

		onVersionChanged();
	    }
	},

	getVersion: function() {
	    return version;
	},

	onVersionChanged: onVersionChanged.add,

	erroneousVersion: function() {
	    historyNumber.classed("erroneous-version", true);
	}
    };
    return m;
};
