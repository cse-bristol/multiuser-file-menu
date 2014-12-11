"use strict";

/*global module, require*/

var callbacks = require("./helpers.js").callbackHandler,
    _ = require("lodash"),
    d3 = require("d3");

/*
 Provides a temporary search box, which will go away when the user clicks on one of the results.

 options.alwaysIncludeSearchText is a boolean which, if set true, will cause the value the user search for to always appear in the search results, even if it doesn't exist (useful for save as operations). If it was added in this way, it will have the class .search-result-fabricated.

 currentPage will have the class .search-result-current-page.
 */
module.exports = function(container, searchFunction, collection, currentPage, callback, onHide, options) {
    var alwaysIncludeSearchText = options.alwaysIncludeSearchText === undefined ? false : options.alwaysIncludeSearchText,

	forbidEmpty = options.forbidEmpty === undefined ? false: options.forbidEmpty,
	
	exclude = options.exclude === undefined ? /(?!)/ : options.exclude,
	
	form = container
	    .append("form")
	    .attr("id", "search-control")
    // Search immediately if you hit enter.
	    .on("submit", function(d, i) {
		d3.event.preventDefault();
		d3.event.stopPropagation();
		
		var topResult = searchResults.select("li");

		if (topResult) {
		    callback(topResult.datum());
		    hideResults(5);
		    
		} else {
		    doSearch();
		}
		return false;
	    });

    form.onsubmit = function() {
    	return false;
    };

    var getSearchValue = function() {
	return search.node().value.toLowerCase().trim();
    };

    var hideResults = function(delay) {
	var maybeTransition = delay ? form.transition().delay(delay) : form;
	maybeTransition.remove();
	onHide();
    };

    var search = form.append("input")
	    .attr("type", "text")
	    .attr("id", "search")
    // Allow a little time for the user to finish typing.
	    .on("input", function(d, i) {
		doSearchSoonish();
	    })
	    .on("blur", function() {
		hideResults(200);
	    });

    // Having a 'submit' input allows you to press enter in the search box to send a search.
    var submit = form.append("input")
    	    .attr("type", "submit")
    	    .style("display", "none");

    var searchResults = form.append("ul")
	    .attr("id", "search-results");    

    var doSearch = function() {
	var val = getSearchValue();

	searchFunction(collection, val, function(names) {
	    var addedVal = false;

	    if (forbidEmpty && val === "") {
		return;
	    }
	    
	    if (val !== getSearchValue()) {
		// The user has changed the text since we issued this search.
		return;
	    }

	    if (alwaysIncludeSearchText && names.indexOf(val) < 0) {
		// Add the search text to the top of the list.
		names = [val].concat(names);
		addedVal = true;
	    }

	    names = names.filter(function(n) {
		return !exclude.test(n);
	    });
	    
	    var results = searchResults.selectAll("li")
		    .data(
			names,
			function(d, i) {
			    return d;
			}
		    );

	    results.exit().remove();

	    var newResults = results.enter().append("li")
		    .classed("search-result", true)
		    .text(function(d, i) {
			return d;
		    })
		    .on("click", function(d, i) {
			callback(d);
			hideResults(5);
		    })
		    .classed("search-result-current-page", function(d, i) {
			return d === currentPage;
		    })
		    .classed("search-result-fabricated", function(d, i) {
			return addedVal && d === val;
		    });
	});
    };

    var doSearchSoonish = _.debounce(doSearch, 500);

    /*
     Fill the box with some initial values.
     */
    doSearch();
    search.node().focus();

    return {
	hide: hideResults
    };
};

