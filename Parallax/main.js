// Globals to automatically calculate effect parameters
var parallaxImageJoin = "s1";
var monitorID, imageW, imageH, projectW, projectH, xRadianMovement, yRadianMovement;

CF.userMain = function() {
	CF.getProperties(parallaxImageJoin, function(j) {
		imageW = j.w;
		imageH = j.h;
	});
	CF.getGuiDescription(function(gui) {
		projectW = gui.portraitSize.w;
		projectH = gui.portraitSize.h;
	});
	// Using a small delay to ensure getProperties and getGuiProperties calls have finished first...
	// Then calculate the values to use in the parallax effect
	setTimeout(function() {
		if (imageW != 0 && imageH != 0 && projectW != 0 && projectH != 0) {
			var xMovement = imageW - projectW,
				yMovement = imageH - projectH;

			xRadianMovement = xMovement / 3; // Pixel amount to shift image on X axis based on Roll range of -1.5 to 1.5
			yRadianMovement = yMovement / 3; // Pixel amount to shift image on Y axis based on Roll range of -1.5 to 1.5
		} else {
			CF.log("Parallax Error: Image object or project dimensions could not be loaded")
		}
	}, 500);
	// Start monitoring the sensor changes
	monitorID = CF.startMonitoring(CF.AttitudeSensor, {captureInterval: 20, reportInterval: 50}, attitudeCallback);
};

function attitudeCallback(sensorType, data) {
	// Ignore the callback if the effect parameters haven't finished being calculated
	if (xRadianMovement == null || yRadianMovement == null) {
		return;
	}

	var roll = data[0].roll;
	var pitch = data[0].pitch;
	//var yaw = Math.abs(data[0].yaw);

	// Roll values to expect:
	// 0 = Flat
	// 1.5 = 90 degrees to the right (on its side)
	// -1.5 = 90 degrees to the left (on its side)
	// Same value range for pitch pretty much
	// Yaw range is -3 to 3 (rotation of the device whilst flat on a table).

	if (roll >= -1.5 && roll <= 1.5) { // Ignore roll ranges beyond -90 and +90 degree tilt (can't see the screen, so don't bother?).
		CF.setProperties({join: parallaxImageJoin, x: (roll-1.5)*xRadianMovement, y: (pitch-1.5)*yRadianMovement}, 0.0, 0.5);
	} else {
		CF.setProperties({join: parallaxImageJoin, y: (pitch-1.5)*yRadianMovement}, 0.0, 0.5);
	}
}