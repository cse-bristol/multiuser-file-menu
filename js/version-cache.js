"use strict";

/*global module, require*/

var d3 = require("d3"),
    helpers = require("./helpers.js"),
    callbacks = helpers.callbackHandler;

/*
 Keeps track of the known versions of particular documents.

 Requests updates as required.
 */
module.exports = function(collection, fetchVersionsFromCollection) {
    var versionsByName = d3.map(),
	onVersionsUpdated = callbacks(),

	listVersions = function(documentName) {
	    if (versionsByName.has(documentName)) {
		return versionsByName.get(documentName)
		    .filter(function(v) {
			return !!v;
		    })
		    .reverse();
	    } else {
		return [];		
	    }
	},

	updateVersions = function(documentName, latestVersion) {
	    if (!documentName) {
		return;
	    }

	    if (!versionsByName.has(documentName)) {
		versionsByName.set(documentName, []);
	    }

	    var versionsFrom = versionsByName.get(documentName).length;

	    if (latestVersion && latestVersion <= versionsFrom) {
		onVersionsUpdated(
		    documentName,
		    listVersions(documentName)
		);

		return;
	    }

	    fetchVersionsFromCollection(collection, documentName, versionsFrom, function(results) {
		var resultsArray = versionsByName.get(documentName);
		
		results.forEach(function(r) {
		    resultsArray[r.v] = r;
		});

		onVersionsUpdated(
		    documentName,
		    listVersions(documentName)
		);
	    });
	};

    return {
	listVersions: listVersions,
	updateVersions: updateVersions,
	onVersionsUpdated: onVersionsUpdated.add
    };
};
