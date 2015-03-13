"use strict";

/*global module, require*/

var callbacks = require("./helpers.js").callbackHandler,
    _ = require("lodash"),
    d3 = require("d3"),
    highlightedResult = "highlighted-result",
    searchResult = "search-result",
    
    /* See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode */
    arrowDown = 40,
    arrowUp = 38;

/*
 Provides a temporary search box, which will go away when the user clicks on one of the results.

 options.currentPage will have the class .search-result-current-page added to it.
 */
module.exports = function(container, searchFunction, onHide, options) {
    var form = container
	    .append("form")
	    .attr("id", "search-control")
	    .on("submit", function(d, i) {
		// Don't submit the form.
		d3.event.preventDefault();
		d3.event.stopPropagation();

		var target = searchResults.select("." + highlightedResult);

		if (target.size() === 0) {
		    // If the results aren't showing, execute the search (the user is waiting...)
		    doSearch();
		} else {
		    // If the results are showing, our user has selected a result.
		    options.f(target.datum());
		    hideResults(5);
		}

		return false;
	    });

    form.onsubmit = function() {
    	return false;
    };

    var getSearchValue = function() {
	return search.node().value.toLowerCase().trim();
    },

	hideResults = function(delay) {
	    var maybeTransition = delay ? form.transition().delay(delay) : form;
	    maybeTransition.remove();
	    onHide();
	},

	moveSelection = function(offset) {
	    var results = searchResults.selectAll("." + searchResult),
		currentI;

	    if (results.empty()) {
		return;
	    }

	    results.each(function(d, i) {
		if (d3.select(this).classed(highlightedResult)) {
		    currentI = i;
		}
	    });

	    var newI = (currentI + offset);

	    if (newI < 0) {
		newI += results.size();
	    }
	    
	    newI %= results.size();

	    if (newI !== currentI) {
		d3.select(
		    results[0][currentI]
		).classed(highlightedResult, false);

		d3.select(
		    results[0][newI]
		).classed(highlightedResult, true);
	    }
	},

	search = form.append("input")
	    .attr("type", "text")
	    .attr("autocomplete", "off")
	    .attr("id", "search")
	    .on("input", function(d, i) {
		// Allow a little time for the user to finish typing.		
		doSearchSoonish();
	    })
	    .on("keydown", function(d, i) {
		if (d3.event.keyCode === arrowDown) {
		    moveSelection(1);
		    
		} else if (d3.event.keyCode === arrowUp) {
		    moveSelection(-1);
		    
		} else {
		    return;
		}

		d3.event.preventDefault();
		d3.event.stopPropagation();
	    })
	    .on("blur", function() {
		hideResults(200);
	    }),

	// Having a 'submit' input allows you to press enter in the search box to send a search.
	submit = form.append("input")
    	    .attr("type", "submit")
    	    .style("display", "none"),

	searchResults = form.append("ul")
	    .attr("id", "search-results"),

	doSearch = function() {
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
			.classed(searchResult, true)
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

		var noneHighlighted = true;
		results.each(function(d, i) {
		    if (d3.select(this).classed(highlightedResult)) {
			noneHighlighted = false;
		    }
		});

		if (noneHighlighted && !results.empty()) {
		    d3.select(results[0][0]).classed(highlightedResult, true);
		}
	    });
	},

	doSearchSoonish = _.debounce(doSearch, 500);

    /*
     Fill the box with some initial values.
     */
    doSearch();
    search.node().focus();

    return {
	hide: hideResults
    };
};

