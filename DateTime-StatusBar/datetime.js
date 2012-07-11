/*
 * Date Time Driver Module
 *
 *****************************************************
 USAGE:
 1. Add date.js to your guiDesigner project
 2. Add datetime.js to your guiDesigner project
 3. Create a new clock object providing the join number to update and the date/time format.

 Date formats are documented here:
 http://code.google.com/p/datejs/wiki/FormatSpecifiers

 For languages other than english US, download the entire 150+ pack of JavaScript files (http://code.google.com/p/datejs/downloads/list) for various cultures.
 Then replace the date.js used in this demo with one of the other .js files, such as date-de-DE.js (German/Deutsch).
 'date.js' in this demo is the same as 'date-en-US.js'.

 ****************************************************/

var DateTimeDriver = function (join, format, frequency) {
	var self = {
		join: join || "s1",
		format: format || "hh:mm tt",
		frequency: frequency || 1000,
		interval: null
	};

	self.stop = function() {
		if (self.interval) {
			clearInterval(self.interval);
			self.interval = null;
		}
	};

	self.start = function() {
		self.stop();
		// Perform update once
		self.updateDateTime();
		// Repeat update at specified frequency
		self.interval = setInterval(self.updateDateTime, self.frequency);
	};

	self.toggle = function() {
		if (self.interval) {
			self.stop();
		} else {
			self.start();
		}
	};
	
	self.updateDateTime = function() {
		CF.setJoin(self.join, new Date().toString(self.format));
	};

	return self;
};

CF.modules.push({
	name: "Date/Time Driver",
	object: DateTimeDriver,
	version: "1.0"
});