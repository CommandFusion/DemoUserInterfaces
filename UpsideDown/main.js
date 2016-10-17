var monitor = -1;
var firstUpdate = true;

CF.userMain = function() {
	startMonitoring();
};

function startMonitoring() {
	if (monitor !== -1) {
		// already monitoring, ignore
		return;
	}
	monitor = CF.startMonitoring(CF.AttitudeSensor, {
		historySize: 10,
		captureInterval: 20,
		reportInterval: 200
	}, function(sensorType, data) {
		var pitch = data[0].pitch;
		var theme = "";
		var text = "PITCH: " + pitch;
		if (firstUpdate) {
			// First time being called, any value above 0 will be right way up
			firstUpdate = false;
			if (pitch > 0) {
				theme = "indicator_green";
				text += "\nRIGHT WAY UP :)";
			} else if (pitch < 0) {
				theme = "indicator_red";
				text += "\nUPSIDE DOWN :(";
			}
		} else {
			if (pitch >= 0.52) {
				theme = "indicator_green";
				text += "\nRIGHT WAY UP :)";
			} else if (pitch <= -0.52) {
				theme = "indicator_red";
				text += "\nUPSIDE DOWN :(";
			}
		}
		// If the sensor has reached a change level, update UI
		if (theme) {
			CF.setProperties({join: "s1", theme: theme});
		}
		CF.setJoin("s1", text);
	});
}

function stopMonitoring() {
	if (monitor !== -1) {
		CF.stopMonitoring(monitor);
		monitor = -1;
	}
}