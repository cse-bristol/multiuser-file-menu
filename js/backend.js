"use strict";

/*global module, require*/

var _ = require("lodash"),
    sharejs = require('../node_modules/share/lib/client/index.js'),
    BCSocket = require('../node_modules/browserchannel/dist/bcsocket-uncompressed.js').BCSocket,
    helpers = require("./helpers.js"),
    callbacks = helpers.callbackHandler;

/*
 Connects to a sharejs server.

 Exposes some functions about it.
 */
module.exports = function(url) {
    var connection = new sharejs.Connection(
	new BCSocket(
	    url,
	    {
		reconnect: true
	    })
    ),
	onUp = callbacks(),
	onDown = callbacks(),
	lastState = connection.state,
	isUp = function() {
	    return connection && connection.state === "connected";
	};

    // TODO remove this once we're happy.
    connection.debug = true;

    ["connected", "connecting", "disconnected", "stopped"]
	.forEach(function(state) {
	    connection.on(state, function() {
		if (state !== lastState) {
		    lastState = state;
		    switch(state) {
		    case "connected":
			onUp();
			break;
		    case "connecting":
			// We don't yet know whether the server is up or down.
			break;
		    case "disconnected":
		    case "stopped":
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

    return {
	search: function(coll, text, callback, errback) {
	    // TODO *insecure*. Anyone could modify the Javascript in arbitrary ways here. Can we fire this from the server side and sanitize the text variable?
	    connection.createFetchQuery(coll, {_id: {$regex: text}}, {}, function(error, results, extraData) {
		if (error) {
		    errback(error);
		} else {
		    callback(_.pluck(results, "name"));
		}
	    });
	},

	load: function(coll, name, callback) {
	    var doc = connection.get(coll, name.toLowerCase());
	    if (!doc.subscribed) {
		doc.subscribe();
	    }
	    doc.whenReady(function() {
		callback(doc);
	    });
	},

	/*
	 When the server is not connected, it's still OK to get a document if we know that it doesn't already exist.

	 To ensure this, the name passed here should be a GUID.
	 */
	loadOffline: function(coll, name) {
	    var doc = connection.get(coll, name.toLowerCase());
	    if (!doc.subscribed) {
		doc.subscribe();
	    }
	    return doc;
	},

	deleteDoc: function(coll, name) {
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

	/*
	 Schedule functions to run when we know for sure whether the server is up or down.
	 */
	waitForConnectOrDisconnect: function(onConnected, onDisconnected) {
	    if (connection.state === "connecting") {
		var executed = false;
		
		connection.once("connected", function() {
		    if (!executed) {
			executed = true;
			onConnected();
		    }
		});

		var fail = function() {
		    if (!executed) {
			executed = true;
			onDisconnected();
		    }
		};

		connection.once("disconnected", fail);
		connection.once("stopped", fail);
		
	    } else if (isUp()) {
		onConnected();
	    } else {
		onDisconnected();
	    }
	},

	/*
	 Schedule function to run the next time the server is up.
	 */
	waitForConnect: function(callback) {
	    if (isUp()) {
		callback();
	    } else {
		connection.once("connected", callback);
	    }
	}
    };
};
