function sliderChanged(value) {
	// Ensure received data is converted to an integer (by default it will be a string)
	value = parseInt(value, 10);
	// Log the output to the debugger
	CF.log("Slider Changed:" + value);
	// Shift the integer 8 bits to the right, result is the left most 8 bits of the slider value
	var msb = (value >> 8);
	// Get the right most 8 bits of the slider value (AND with 255)
	var lsb = (value & 0xFF);
	CF.log("MSB: " + msb);
	CF.log("LSB: " + lsb);
	CF.setJoin("s1", "MSB: " + msb + ", LSB: " + lsb);
	// Reconstruct the bytes within some command to send to a system.
	// This command can be whatever you need, this is just an example.
	// Replace "Loopback" with the name of your system in guiDesigner
	CF.send("Loopback", String.fromCharCode(msb) + "some data" + String.fromCharCode(lsb));
	// Reference to some handy hex functions in JS:
	// https://gist.github.com/jarrodbell/5159311
}