"use strict";

/*global module, require*/

var d3 = require("d3"),
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
	};

    var standardButtons = [
	spec.button(
	    "New",
	    newDoc,
	    {
		embeddedStandalone: standalone
	    }
	),

	spec.button(
	    "Open",
	    open,
	    {
		onlineOffline: online,
		embeddedStandalone: standalone,
		search: {}
	    }
	)
    ].concat(
	spec.toggle(
	    "History",
	    function() {
		onOpen(title, historySlider.node().value);
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
		onOpen(title, null);
	    },
	    {
		onlineOffline: online,
		readWriteSync: {
		    untitle: false,
		    read: true, // TODO: not for 'new' documents.
		    write: false,
		    sync: false
		},			
		embeddedStandalone: standalone,
		hooks: function(el) {
		    historySlider = el.append("input")
			.attr("id", "history-slider")
			.attr("type", "range")
			.attr("min", 0)
			.on("input", function(d, i) {
			    historyNumber.node().value = this.value;
			    onOpen(title, this.value);
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
			    onOpen(title, this.value);
			})
			.on("click", function(d, i) {
			    // Stop the history button from toggling.
			    d3.event.stopPropagation();
			});
		}
	    }
	)
    )

	    .concat(

		spec.toggle(
		    "Auto",
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
		))    
	    .concat([
		spec.button(
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

		spec.button(
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
		
		spec.button(
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

		spec.button(
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
		)
	    ]);

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

	setMaxVersion: function(val) {
	    if (isNum(val)) {
	    
		if (!isNum(historySlider.attr("max"))) {
		    m.setVersion(val);
		}
		
		historySlider.attr("max", val);
		historyNumber.attr("max", val);
	    }
	},

	setVersion: function(val) {
	    if (isNum(val)) {
		historySlider.node().value = val;
		historyNumber.node().value = val;
	    }
	}
    };
    return m;
};
