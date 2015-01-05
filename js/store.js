"use strict";

/*global module, require*/

var _ = require("lodash"),
    helpers = require("./helpers.js"),
    noop = helpers.noop,
    callbacks = helpers.callbackHandler;

/*
 Operates on a single collection.  Keeps track of the open sharejs document for that collection. 

 Translates things the user does with the document control into actions on the backend.
 */
module.exports = function(collection, backend, documentControl, serialize, deserialize, getModel, setModel, freshModel) {
    var doc,
	context,
	// Manual mechanism to track when we're making changes, so that we don't write out own events.
	writing = false,
	
	autoSave = false,
	onAutoSaveChanged = callbacks(),
	setAutoSave = function(val) {
	    autoSave = val;
	    onAutoSaveChanged(val);
	},
	
	onOp = callbacks(),
	setDoc = function(newDoc) {
	    if (doc === newDoc) {
		return;
	    } else {
		if (doc) {
		    doc.destroy();
		    context = null;
		}
		
		doc = newDoc;
		setAutoSave(false);
		
		if (doc) {
		    doc.on("after op", function(ops, context) {
			if (!writing && autoSave) {
			    ops.forEach(function(op) {
				onOp(op);
			    });
			}
		    });
		}
	    }
	},
	/*
	 Document must have been deleted for this to work.
	 */
	saveDoc = function(model) {
	    writing = true;
	    
	    doc.create("json0", serialize(model));
	    context = doc.createContext();
	    
	    writing = false;
	},

	loadFromCollection = function(name, f) {
	    backend.load(collection, name, f);
	};
    
    documentControl.onOpen(function(name) {
	loadFromCollection(
	    name,
	    function(loaded) {
		setDoc(loaded);
		var snapshot = doc.getSnapshot();
		
		if (snapshot) {
		    setModel(
			deserialize(snapshot)
		    );
		    context = doc.createContext();
		    
		} else {
		    var model = freshModel();
		    saveDoc(model);
		    setModel(model);
		}
	    }
	);
    });

    documentControl.onDelete(function(name) {
	backend.deleteDoc(collection, name);
    });

    documentControl.onSaveAs(function(name) {
	if (doc && doc.name === name) {
	    /*
	     Overwrite the contents of the document without reloading it.  
	     */
	    doc.del();
	    saveDoc(getModel());
	}
	
	loadFromCollection(
	    name,
	    function(loaded) {
		setDoc(loaded);
		var snapshot = loaded.getSnapshot();
		if (snapshot) {
		    doc.del();
		}

		saveDoc(getModel());
	    });
    });

    documentControl.onNew(function() {
	setDoc(null);
	setModel(freshModel());
    });

    documentControl.onAutoSaveChange(setAutoSave);

    return {
	writeOp: function(op) {
	    if (autoSave) {
		writing = true;
		try {
		    // If we don't have a document context yet, there's no point trying to send operations to it.
		    if (context) {
			context.submitOp([op], noop);
		    }
		} finally {
		    writing = false;
		}
	    }
	},

	onOp: onOp.add,

	loadSnapshot: function(name, callback, errback) {
	    loadFromCollection(
		name,
		function(loaded) {
		    try {
			var snapshot = loaded.getSnapshot();
			if (snapshot) {
			    callback(
				deserialize(snapshot));
			} else {
			    errback();
			}
		    } finally {
			loaded.destroy();
		    }
		}
	    );
	},

	onAutoSaveChanged: onAutoSaveChanged.add,

	autoSave: function() {
	    return autoSave;
	},

	setAutoSave: setAutoSave
    };
};
