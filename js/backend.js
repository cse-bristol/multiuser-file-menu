"use strict";

/*global module, require*/

var _ = require("lodash"),
    d3 = require("d3"),
    sharejs = require('../node_modules/share/lib/client/index.js'),
    BCSocket = require('../node_modules/browserchannel/dist/bcsocket-uncompressed.js').BCSocket,
    helpers = require("./helpers.js"),
    isNum = helpers.isNum,
    callbacks = helpers.callbackHandler,

    connected = "connected",
    connecting = "connecting",
    disconnected = "disconnected",
    stopped = "stopped";

/*
 Connects to a sharejs server.

 Exposes some functions about it.
 */
module.exports = function(maintainConnection, url) {
    var ensureConnected = function() {
	if (maintainConnection && isDown()) {
	    connection = new sharejs.Connection(
		new BCSocket(
		    url,
		    {
			reconnect: true
		    })
	    );

	    connection.debug = debug;

	    [connected, connecting, disconnected, stopped]
		.forEach(function(state) {
		    connection.on(state, function() {
			if (state !== lastState) {
			    lastState = state;
			    switch(state) {
			    case connected:
				onUp();
				break;
			    case connecting:
				// We don't yet know whether the server is up or down.
				break;
			    case disconnected:
			    case stopped:
				onDown();
				break;
			    default:
				throw new Error("Unknown connection state " + state);
			    }
			}
			if (isUp()) {
			    onUp();
			} else {
			    onDown();
			}
		    });
		});
	}
    },

	connection,
	onUp = callbacks(),
	onDown = callbacks(),
	lastState,

	debug = false,

	isUp = function() {
	    return connection && connection.state === connected;
	},

	/*
	 There is no connection at all, or the connection there is has fallen right over.
	 */
	isDown = function() {
	    return !connection || connection.state === stopped;
	},

	m = {
	    search: function(coll, text, callback, errback) {
		d3.json(
		    [url, "search", coll].join("/") + "?q=" + text,
		    function(error, results) {
			if (error) {
			    errback(error);
			} else {
			    callback(_.pluck(results, "name"));
			}
		    }
		);
	    },

	    /*
	     Gets a document.
	     */
	    load: function(coll, name, callback) {
		ensureConnected();
		var doc = connection.get(coll, name.toLowerCase());
		if (!doc.subscribed) {
		    doc.subscribe();
		}
		doc.whenReady(function() {
		    callback(doc);
		});
	    },

	    /*
	     Gets a document snapshot without loading the whole document.

	     Used when we are in offline mode.
	     */
	    loadSnapshot: function(coll, name, callback, errback) {
		d3.json(
		    [url, "current", coll, name].join("/"),
		    function(error, json) {
			if (error) {
			    errback(error.response);
			} else if (json.data) {
			    callback(json.data);
			}
		    }
		);
	    },

	    /*
	     Object returns has 3 properties:
	     doc - the deserialized json snapshot
	     v - the version of that snapshot
	     latestV - the most recent version of the document available
	     */
	    loadVersion: function(coll, name, version, callback, errback) {
		if (!isNum(version)) {
		    throw new Error("Not a valid version " + version);
		}
		
		d3.json(
		    [url, "history", coll, name, version].join("/"),
		    function(error, json) {
			if (error) {
			    errback(error.response);
			} else {
			    callback(json);
			}
		    }
		);
	    },

	    deleteDoc: function(coll, name) {
		ensureConnected();
		var toDelete = connection.get(coll, name.toLowerCase());
		if (!toDelete.subscribed) {
		    toDelete.subscribe();
		}
		toDelete.whenReady(function() {
		    toDelete.del();
		    toDelete.destroy();
		});
	    },

	    onUp: onUp.add,
	    onDown: onDown.add,
	    isUp: isUp,

	    isDebugging: function() {
		return debug;
	    },

	    setDebug: function(value) {
		if (debug !== !!value) {
		    debug = !!value;
		    if (connection) {
			connection.disconnect();
		    }
		    ensureConnected();
		}
	    }
	};

    if (maintainConnection) {
	ensureConnected();
    }

    return m;
};
