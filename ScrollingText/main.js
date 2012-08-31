// Create the new scrolling text object, providing some parameters as required
var scroller1 = new ScrollingText({serialJoin: "s1", speed: 80, spaces: 5});

// This function is called when iViewer is initialised and all JavaScript is loaded.
// Anything requiring CF.* calls must only be called after this function is called.
CF.userMain = function() {
	// Initialise our scrolling text object. This step is required to be run within the CF.userMain function
	// This will automatically start the scrolling unless we turned auto-start off in the paramaters when creating the ScrollingText object
	scroller1.init();

	// Everything below this line only relates to the demo GUI and the ability to change the settings of the scroller on the fly.
	// You do not need to copy all this to your own projects.

	// Set settings GUI to show same values as the scroller
	CF.setJoins([
		{join: "s100", value: scroller1.speed},
		{join: "s101", value: scroller1.spaces},
		{join: "s102", value: scroller1.startingVal},
	]);

	if (scroller1.direction == "right") {
		CF.setJoins([{join: "d103", value: 0},{join: "d104", value: 1}]);
	} else {
		CF.setJoins([{join: "d103", value: 1},{join: "d104", value: 0}]);
	}

	// Listen to events for settings changes in the demo GUI

	// Speed setting (change the speed that the text scrolls, in milliseconds)
	CF.watch(CF.InputFieldEditedEvent, "s100", function(j,v) {
		// validate the setting
		if (isNumber(v)) {
			scroller1.speed = parseInt(v, 10);
			scroller1.start();
		}
	});

	// Spaces settings (change the number of spaces separating the wrap around of scrolling text)
	CF.watch(CF.InputFieldEditedEvent, "s101", function(j,v) {
		// validate the setting
		if (isNumber(v)) {
			scroller1.spaces = parseInt(v, 10);
			scroller1.reset();
		}
	});

	// Text setting (change the scrolling text value)
	CF.watch(CF.InputFieldEditedEvent, "s102", function(j,v) {
		scroller1.reset(v);
	});
};

function changeDirection(direction) {
	// Change scroller direction
	scroller1.direction = direction;

	// Change GUI to reflect the applied setting
	if (direction == "right") {
		CF.setJoins([{join: "d103", value: 0},{join: "d104", value: 1}]);
	} else {
		CF.setJoins([{join: "d103", value: 1},{join: "d104", value: 0}]);
	}
}

// Helper function to validate numeric input
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}