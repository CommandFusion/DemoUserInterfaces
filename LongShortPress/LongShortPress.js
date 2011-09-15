/*
Module for running a different command based on short or long press.
Use advanced button actions to setup each call.
1. On press to reset - this ensures that the short press command is not fired if a long press is activated.
2. On press with delay for the long press
3. On release for the short press

For example:
You have two commands defined in your guiDesigner project: "Lights Dim Down" and "Lights Off".
You want to fire "Lights Off" on long press, and "Lights Dim Down" on short press.
You would create a button, then in advanced button properties create a single action group, along
with 3 button actions.
Action 1: On press, no delay, call script LongShortPress.pressStart();
Action 2: On press, 1000ms delay, call script LongShortPress.onLongPress("Lights Off");
Action 3: On release, call script LongShortPress.onShortRelease("Lights Dim Down");

Note: You can also pass a function instead of a command name. This will run the function instead of run a command.
The function must be defined somewhere else in your JavaScript code.

*/
var LongShortPress = {
	longPressActivated: false,

	// Call this function on press (without delay) to reset the flag
	pressStart: function() {
		LongShortPress.longPressActivated = false;
	},

	// Call this function on press, with delay of your choice
	onLongPress: function(cmdNameOrFunction) {
		// Set the flag to true, long press has been called
		LongShortPress.longPressActivated = true;
		// Check if user wants to send a command or call another JavaScript function via callback
		if (typeof cmdNameOrFunction === 'function') {
			cmdNameOrFunction();
		} else {
			CF.runCommand(null, cmdNameOrFunction);
		}
	},
	
	// Call this function on release
	onShortRelease: function(cmdNameOrFunction) {
		// Only perform the action if long press has not been activated yet
		if (!LongShortPress.longPressActivated) {
			// Check if user wants to send a command or call another JavaScript function via callback
			if (typeof cmdNameOrFunction === 'function') {
				cmdNameOrFunction();
			} else {
				CF.runCommand(null, cmdNameOrFunction);
			}
		}
		// Reset the flag
		LongShortPress.longPressActivated = false;
	}
};