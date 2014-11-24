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
	isUp = function(state) {
	    return state === "connected" || state === "connecting";
	};

    // TODO remove this once we're happy.
    connection.debug = true;

    ["connected", "connecting", "disconnected", "stopped"]
	.forEach(function(state) {
	    connection.on(state, function() {
		if (isUp(state)) {
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
	isUp: function() {
	    return connection && isUp(connection.state);
	}
    };
};
