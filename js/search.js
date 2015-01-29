"use strict";

/*global module, require*/

var callbacks = require("./helpers.js").callbackHandler,
    _ = require("lodash"),
    d3 = require("d3");

/*
 Provides a temporary search box, which will go away when the user clicks on one of the results.

 options.currentPage will have the class .search-result-current-page added to it.
 */
module.exports = function(container, searchFunction, onHide, options) {
    var form = container
	    .append("form")
	    .attr("id", "search-control")
    // Search immediately if you hit enter.
	    .on("submit", function(d, i) {
		d3.event.preventDefault();
		d3.event.stopPropagation();
		
		var topResult = searchResults.select("li");

		if (topResult.size()) {
		    options.f(topResult.datum());
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
	    .attr("autocomplete", "off")
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

	searchFunction(options.collection, val, function(names) {
	    var addedVal = false;

	    if (options.excludeTerms.test(val)) {
		return;
	    }
	    
	    if (val !== getSearchValue()) {
		// The user has changed the text since we issued this search.
		return;
	    }

	    if (options.includeSearchTerm && names.indexOf(val) < 0) {
		// Add the search text to the top of the list.
		names = [val].concat(names);
		addedVal = true;
	    }

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
			options.f(d);
			hideResults(5);
		    })
		    .classed("search-result-current-page", function(d, i) {
			return d === options.currentPage;
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

