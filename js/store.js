"use strict";

/*global module, require*/

var _ = require("lodash"),
    helpers = require("./helpers.js"),
    noop = helpers.noop,
    callbacks = helpers.callbackHandler;

/*
 Translates things the user does with the document control into actions on the backend.

 Keeps track of the open sharejs document.
 */
module.exports = function(collection, backend, documentControl, serialize, deserialize, getModel, setModel, freshModel) {
    var doc,
	context,
	// Manual mechanism to track when we're making changes, so that we don't write out own events.
	writing = false,
	onOp = callbacks(),
	setDoc = function(newDoc) {
	    if (doc) {
		doc.destroy();
		context = null;
	    }
	    doc = newDoc;
	    doc.on("after op", function(ops, context) {
		if (!writing) {
		    ops.forEach(function(op) {
			onOp(op);
		    });
		}
	    });
	    
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

    documentControl.onNew(function(name) {
	loadFromCollection(
	    name,
	    function(loaded) {
		setDoc(loaded);
		var snapshot = loaded.getSnapshot();
		if (snapshot) {
		    doc.del();
		}

		var model = freshModel();
		saveDoc(model);
		setModel(model);
	    });
    });

    return {
	writeOp: function(op) {
	    writing = true;
	    try {
		context.submitOp([op], noop);
	    } finally {
		writing = false;
	    }
	},

	onOp: onOp.add
    };
};
