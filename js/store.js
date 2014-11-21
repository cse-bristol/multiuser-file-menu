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
module.exports = function(backend, documentControl, serialize, deserialize, getModel, setModel, freshModel, mergeModel) {
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
	};
    
    documentControl.onOpen(function(name) {
	backend.load(
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

    documentControl.onInsert(function(name) {
	backend.load(
	    name,
	    function(loaded) {
		try {
		    var snapshot = loaded.getSnapshot();
		    if (snapshot) {
			mergeModel(
			    deserialize(snapshot)
			);
		    } else {
			throw new Error("Attempted to import a collection, but it has been deleted " + name);
		    }
		} finally {
		    loaded.destroy();
		}
	    }
	);
    });

    documentControl.onDelete(backend.deleteDoc);

    documentControl.onSaveAs(function(name) {
	backend.load(
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
	backend.load(
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
