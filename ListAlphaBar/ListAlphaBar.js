/* List Alpha Jump Bar
===============================================================================

AUTHOR:		Darren Vollmer, JAG Electrical Systems, LLC
CONTACT:	dgvollmer@gmail.com

		I am available for contract CommandFusion programming

-----------------------------------------------------------------------------*/

var ListAlphaBar = function() {
	var self = {
		numMatch:	/^[0-9]/i // Regex to match the join value starting with a numerical value
	};

	/**
	 * Function: Scroll a list to the first occurance of a letter (or first numeric item)
	 * ---------
	 * This method is called both from a letter button, and from the slider after it has calculated its letter
	 *
	 * @Param listJoin {integer}	= The join number for the list we want to scroll
	 * @Param contentJoin {integer} = The join number for the text object in the list item that we are comparing the letter to
	 * @Param letter {char}			= The letter we want to scroll to. Use the # (hash symbol) to scroll to the first numeric item.
	 */
	self.scrollTo = function(listJoin, contentJoin, letter){
		letter = letter.toLowerCase(); // Force the letter to lowercase for matching later

		// Get the contents of the list so we can find the position of the first item matching the letter and scroll to it
		CF.listContents("l" + listJoin, 0, 0, function(listItems) {
			// Loop through each item in the list
			for (var i =0; i < listItems.length; i++ ) {
				var contentItems = listItems[i];
				// Loop through each join in a single list item
				for (var join in contentItems) {
					// Check if the join matches the object we are checking the text value of
					if (join == contentJoin) {
						var text = contentItems[join].value; // Get the value of the join
	
						// if letter = A-Z, scroll to the first item in the list starting with the letter
						if (text.toLowerCase()[0] == letter) {
							// Scroll the list to make this item the top of the list, without animating the scroll
							CF.listScroll("l" + listJoin, i, CF.TopPosition, false);
							return; // Found the item, now exit the function
						}
						// if letter = #, scroll to the first numeric item in the list
						if (letter == "#" && self.numMatch.exec(text)) {
							// Scroll the list to make this item the top of the list, without animating the scroll
							CF.listScroll("l" + listJoin, i, CF.TopPosition, false);
							return; // Found the item, now exit the function
						}
					}
				}
			}
		});
	};

	/**
	 * Function: Scroll a list to the alphanumeric item via moving a slider
	 * ---------
	 * This method is called from a standard command in System Manager (defined within a loopback system).
	 * The sliderVal is obtained through the [sliderval] token defined in the command value.
	 * Then anything in the command value is automatically assigned to the variable "data" which is sent to this function.
	 *
	 * @Param listJoin {integer}	= The join number for the list we want to scroll
	 * @Param sliderVal {integer}	= The value of the slider (0-27)
	 * @Param contentJoin {integer} = The join number for the text object in the list item that we are comparing the letter to
	 */
	self.slideTo = function(listJoin, sliderVal, contentJoin) {
		// Calculate the letter based on the slider value (0-27)
		// To allow for better accuracy of the letter, both 0 and 1 slider values will equal "#" in the slider.
		var letter = "#";
		if (sliderVal > 1) {
			// Use ascii char code and convert to the letter (letter a = 97, b = 98, and so on)
			// We have to use parseInt here otherwise the + symbol might concatenate the numbers together, rather than add them.
			// This is because parameters may be passed as strings from tokens such as [sliderval]
			letter = String.fromCharCode(95 + parseInt(sliderVal));
		}
		// Call the scrollTo function defined above
		self.scrollTo(listJoin, contentJoin, letter);
	};

	// This function is strictly a helper function to populate a list with fake data
	self.templist = function(listJoin) {
		var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var listItems = [];
		for ( var i = 0; i < alphabet.length; i++ ) {
			for ( var j = 0; j < 25; j++ ) {
				listItems.push({s1: alphabet.charAt(i) + "_____" + j});
			}
		}
		CF.listAdd("l"+listJoin, listItems);
	};

	return self;
};

// Create the navigation menu
var AlphaBar = new ListAlphaBar();