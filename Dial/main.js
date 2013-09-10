// Create the dial object we want to be able to use in our GUI
var myDial = new Dial("s1", dialChanged, {srcJoin: "s2", maxTime: 0.2, minTime: 0.1, angleOffset: -45, maxAngle: 260});

function dialChanged(newAngle) {
	// Do something with the new angle
	
	// Set state of power button in the demo GUI (any value above 0 will send a digital join high)
	CF.setJoin("d2", newAngle);

	// Set value of slider in the demo GUI, only if we aren't adjusting the slider at the time.
	// Slider digital joins are not accessible via JavaScript just yet, available in build 216 and greater
	CF.getJoin("d1", function (j, v) {
		if (v == "0") {
			CF.setJoin("a1", (65535 / self.MAX_ANGLE) * newAngle);
		}
	});
}