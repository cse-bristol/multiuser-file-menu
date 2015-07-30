"use strict";

/*global module, require*/

var _ = require("lodash"),
    helpers = require("./helpers.js"),
    isNum = helpers.isNum,
    noop = helpers.noop,
    callbacks = helpers.callbackHandler,

    versionCacheFactory = require("./version-cache.js");

/*
 Operates on a single collection.  Keeps track of the open sharejs document for that collection. 
 */
module.exports = function(maintainConnection, collection, backend, serialize, deserialize, getModel, setModelToObject, freshModel) {
    var title = null,
	version = null,
	onNavigate = callbacks(),

	navigate = function(newTitle, newVersion) {
	    if (title === newTitle && version === newVersion) {
		return;
	    }
	    
	    title = newTitle;

	    if (isNum(newVersion)) {
		version = parseInt(newVersion);
	    } else {
		version = newVersion;
	    }

	    onNavigate(title, version);
	},

	autosave = false,

	onAutosaveChanged = callbacks(),

	setAutosave = function(newAutoSave) {
	    autosave = newAutoSave;
	    
	    onAutosaveChanged(newAutoSave);
	},
	
	doc,
	context,
	// Manual mechanism to track when we're making changes, so that we don't write out own events.
	writing = false,

	versionCache = versionCacheFactory(collection, backend.getVersionsList),

	/*
	 A helpful wrapper to make sure that we poke the version when we change the model.
	 */
	setModel = function(obj, name, version, latestAvailableVersion) {
	    setModelToObject(obj);
	    navigate(name, version);
	    versionCache.updateVersions(name, latestAvailableVersion);
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
		setAutosave(false);
		
		if (doc) {
		    doc.on("after op", function(ops, context) {
			versionCache.updateVersions(title);
			
			if (!writing && autosave) {
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
		doc.submitOp(
		    [{
			p: [],
			oi: serialized
		    }],
		    function() {
			versionCache.updateVersions(
			    title
			);
		    }
		);
	    }
	    context = doc.createContext();
	    
	    writing = false;
	},

	loadFromCollection = function(name, f) {
	    backend.load(collection, name, f);
	},

	newDocument = function() {
	    setDoc(null);
	    setModel(freshModel());
	};
    
    return {
	getTitle: function() {
	    return title;
	},

	getVersion: function() {
	    return version;
	},

	onNavigate: onNavigate.add,

	getAutosave: function() {
	    return autosave;
	},

	onAutosaveChanged: onAutosaveChanged.add,

	onVersionsListUpdated: versionCache.onVersionsUpdated,
	
	newDocument: newDocument,

	openDocument: function(name, version) {
	    if (isNum(version)) {
		backend.loadVersion(
		    collection,
		    name,
		    version,
		    function(historical) {
			setDoc(null);
			setModel(
			    deserialize(historical.doc),
			    name,
			    version,
			    historical.latestV
			);
		    },
		    function(error) {
			throw error;
		    }
		);

	    } else if (!maintainConnection) {
		backend.loadSnapshot(
		    collection,
		    name,
		    function(snapshot) {
			setDoc(null);
			setModel(
			    deserialize(snapshot),
			    name,
			    null,
			    null
			);
		    },
		    function(error) {
			throw new Error(error);
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
				name,
				null,
				doc.version
			    );
			    context = doc.createContext();
			    
			} else {
			    var model = freshModel();
			    setModel(
				model,
				name,
				null,
				doc.version
			    );
			}
		    }
		);
	    }
	},

	saveDocument: function(name) {
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
	},

	deleteDocument: function(name) {
	    backend.deleteDoc(collection, name);
	    if (name === title) {
		newDocument();
	    }
	},
	
	writeOp: function(op) {
	    if (autosave) {
		writing = true;
		try {
		    // If we don't have a document context yet, there's no point trying to send operations to it.
		    if (context) {
			context.submitOp(
			    op instanceof Array ? op : [op],
			    function() {
				versionCache.updateVersions(
				    title
				);
			    }
			);
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
	}
    };
};
