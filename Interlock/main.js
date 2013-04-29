CF.userMain = function() {
	// Create interlock group for buttons
	Interlock.create("buttons", "d1","d2","d3","d4");

	// Create an interlock group for subpages
	Interlock.create("subpages", ["d100", "d200", "d300", "d400"]);

	// Setup a watch callback to display the current selection
	Interlock.watch("buttons", function(group, currentSelection, previousSelection) {
		CF.setJoin("s1", "Current selection in group 1 is " + currentSelection);
		// show the subpage associated with interlock group 1
		// do it the lazy way - d1 becomes d100, d2 becomes d200 etc
		// when we show one of the subpages, the subpages interlock group kicks in and hides the others
		Interlock.select("subpages", currentSelection+"00");
	});

	// Set the group initial values
	Interlock.select("buttons", "d2");
};