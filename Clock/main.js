CF.userMain = function() {
	// Once the JS API is ready, start a recurring function call every second using JavaScript's built in setInterval function
	setInterval(updateClock, 1000);
};

// Called every second via setInterval
function updateClock() {
	// Get current date/time
	var now = new Date();
	// Get the time components
	var hour = now.getHours(), min = now.getMinutes(), sec = now.getSeconds();

	// Use some math to rotate each time component's hand on the z-axis.

	// Large clock hands
	CF.setProperties({join: "s1", zrotation: (hour * 30) + (min / 2)}); // 30 degrees per hour, plus 0.5 degrees per minute.
	CF.setProperties({join: "s2", zrotation: (min * 6) + (sec / 10)}); // 6 degrees per minute, plus 0.1 degree per second.
	CF.setProperties({join: "s3", zrotation: sec * 6}); // 6 degrees per second

	// Small clock hands (same math, just different join numbers)
	CF.setProperties({join: "s11", zrotation: (hour * 30) + (min / 2)});
	CF.setProperties({join: "s12", zrotation: (min * 6) + (sec / 10)});
	CF.setProperties({join: "s13", zrotation: sec * 6});
}