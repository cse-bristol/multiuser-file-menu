"use strict";

/*global module, require*/

var _ = require("lodash"),
    helpers = require("./helpers.js"),
    isNum = helpers.isNum,
    noop = helpers.noop,
    callbacks = helpers.callbackHandler;

/*
 Operates on a single collection.  Keeps track of the open sharejs document for that collection. 

 Translates things the user does with the document control into actions on the backend.
 */
module.exports = function(collection, backend, documentControl, serialize, deserialize, getModel, setModelToObject, freshModel) {
    var doc,
	context,
	// Manual mechanism to track when we're making changes, so that we don't write out own events.
	writing = false,

	/*
	 docVersion will be set to the version when we load a historical document. If we are in a current 'live' document (whether autosave or not), it should be set to null. 
	 */
	docVersion = null,
	setVersion = function(v, latestV) {
	    docVersion = v;
	    documentControl.setVersion(v, latestV);
	},
	
	autoSave = false,
	onAutoSaveChanged = callbacks(),
	setAutoSave = function(val) {
	    autoSave = val;
	    onAutoSaveChanged(val);
	},

	/*
	 A helpful wrapper to make sure that we poke the version when we change the model.
	 */
	setModel = function(obj, version, latestAvailableVersion) {
	    setModelToObject(obj);
	    setVersion(version, latestAvailableVersion);
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
	
	saveDoc = function(model) {
	    writing = true;

	    var snapshot = doc.getSnapshot(),
		serialized = serialize(model);
	    
	    if (!snapshot) {
		doc.create("json0", serialized);
	    } else {
		doc.submitOp([{
		    p: [],
		    oi: serialized
		}]);
	    }
	    context = doc.createContext();
	    
	    writing = false;
	},

	loadFromCollection = function(name, f) {
	    backend.load(collection, name, f);
	};
    
    documentControl.onOpen(function(name, version) {
	if (isNum(version)) {
	    backend.loadVersion(
		collection,
		name,
		version,
		function(historical) {
		    setDoc(null);
		    setModel(
			deserialize(historical.doc),
			version,
			historical.latestV
		    );
		},
		function(error) {
		    setVersion(version, null);
		    documentControl.erroneousVersion();
		}
	    );
	    
	} else {
	    loadFromCollection(
		name,
		function(loaded) {
		    setDoc(loaded);
		    var snapshot = doc.getSnapshot();
		    
		    if (snapshot) {
			setModel(
			    deserialize(snapshot),
			    null,
			    doc.version
			);
			context = doc.createContext();
			
		    } else {
			var model = freshModel();
			setModel(
			    model,
			    null,
			    doc.version
			);
		    }
		}
	    );
	}
    });

    documentControl.onDelete(function(name) {
	backend.deleteDoc(collection, name);
    });

    documentControl.onSaveAs(function(name) {
	if (doc && doc.name === name) {
	    saveDoc(getModel());

	} else {
	    loadFromCollection(
		name,
		function(loaded) {
		    setDoc(loaded);
		    saveDoc(getModel());
		});
	}
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
			context.submitOp(
			    op instanceof Array ? op : [op],
			    noop
			);
			setVersion(null, doc.version);
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

	getVersion: function() {
	    return docVersion;
	},

	onAutoSaveChanged: onAutoSaveChanged.add,

	autoSave: function() {
	    return autoSave;
	},

	setAutoSave: setAutoSave
    };
};
