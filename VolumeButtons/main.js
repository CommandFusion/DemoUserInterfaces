var previousVolume, timeout;

CF.userMain = function() {
	// Watch for changes to volume
	CF.watch(CF.DevicePropertyChangeEvent, CF.SoundOutputVolumeProperty, function onPropertyChange(property, value) {
		// Ensure volume change is detected
		if (property == CF.SoundOutputVolumeProperty) {
			// Log the volume level for debugging
			CF.log("New Volume: " + value);

			// Volume will continue to report 1 whilst volume up is pressed and iOS device volume is already at full
			// So add checks for that (same for when volume is at lowest and vol down button is pressed)

			// NOTE: CURRENTLY THE SOUND LEVEL IS NOT REPORTED WHEN VOLUME BUTTON IS PRESSED IF THE VOLUME LEVEL DOESNT CHANGE!
			// Example: current volume = full, press volume up button will not trigger the event.
			// TODO - change iViewer to allow this.
			if (value > previousVolume || value == 1) {
				// vol up pressed
				CF.setJoin("s1", "Volume Up Pressed, volume = " + value);
			} else {
				// vol down pressed
				CF.setJoin("s1", "Volume Down Pressed, volume = " + value);
			}

			// Set the screen brightness to match the volume as an example
			CF.setDeviceProperty(CF.ScreenBrightnessProperty, value);

			// Clear message one second later
			clearTimeout(timeout);
			timeout = setTimeout(function(){CF.setJoin("s1", "");}, 2000);
			// Store volume for comparion on next volume change
			previousVolume = value;
		}
	});
}