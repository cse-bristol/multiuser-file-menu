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
	onOp = callbacks(),
	setDoc = function(newDoc) {
	    if (doc) {
		doc.destroy();
		context = null;
	    }
	    doc = newDoc;
	    if (doc) {
		doc.on("after op", function(ops, context) {
		    if (!writing) {
			ops.forEach(function(op) {
			    onOp(op);
			});
		    }
		});
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

    return {
	writeOp: function(op) {
	    writing = true;
	    try {
		// If we don't have a document context yet, there's no point trying to send operations to it.
		if (context) {
		    context.submitOp([op], noop);
		}
	    } finally {
		writing = false;
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
	}
    };
};
