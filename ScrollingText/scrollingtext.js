var ScrollingText = function(params) {
	var self = {
		serialJoin: params.serialJoin || "s1",	// the serial join of the GUI object we want to manipulate
		startingVal: params.newText || "",		// the starting text value
		textVal: params.newText || "",			// the manipulated text value
		speed: params.speed || 100,				// update interval in milliseconds
		scrollInterval: null,					// storage of the interval ID so we can clear it later
		spaces: params.spaces || 1,				// the number of spaces to insert between the start and end of the text
		direction: params.direction || "left",	// direction to scroll (left or right)
		autoStart: (params.autoStart === undefined) ? true : params.autoStart	// start the scrolling automatically, or wait
	};

	self.init = function() {
		// Get the starting value if we haven't already defined it
		if (self.startingVal == "") {
			CF.getJoin(self.serialJoin, function(j,v) {
				self.startingVal = v;
				self.textVal = self.startingVal + Array(self.spaces+1).join(" ");
				if (self.autoStart) {
					self.start();
				}
			});
		} else {
			// Starting value already defined
			if (self.autoStart) {
				self.start();
			}
		}
	};

	self.start = function() {
		// Clear any existing scroll interval
		clearInterval(self.scrollInterval);
		// Start the scrolling
		self.scrollInterval = setInterval(self.scroll, self.speed);
	};

	self.scroll = function() {
		// Manipulate the text value to simulate scrolling the text
		if (self.direction == "right") {
			self.textVal = self.textVal[self.textVal.length-1] + self.textVal.substring(0, self.textVal.length - 1);
		} else {
			self.textVal = self.textVal.substring(1) + self.textVal[0];
		}
		CF.setJoin(self.serialJoin, self.textVal);
	};

	self.stop = function() {
		clearInterval(self.scrollInterval);
	};

	self.reset = function(newTextValue) {
		if (newTextValue) {
			self.startingVal = newTextValue;
		}
		CF.setJoin(self.serialJoin, self.startingVal);
		self.textVal = self.startingVal + Array(self.spaces+1).join(" ");
	}

	return self;
};

CF.modules.push({
    name: "Scrolling Text",
    object: ScrollingText,
    version: 1.0
});