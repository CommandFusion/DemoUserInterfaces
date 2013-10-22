CF.userMain = function() {
	CF.watch(CF.FeedbackMatchedEvent, "LightingSystem", "INCOMING_DATA", parseFeedback);

	// Test Cases
	//parseFeedback("something", "\x22\x01\x10\x00\x00\x00\x02\x35");
	//parseFeedback("something", "\x22\x01\x10\x00\x00\x00\xFF\x35");
	//parseFeedback("something", "\x22\x01\x10\x00\x00\x00\x07\x35");
};

function parseFeedback(feedbackItem, matchedString) {
	/* Example incoming data, in hex format, is:
	 22 01 10 00 00 00 02 35
	 First byte is just to signify a reply
	 Last byte is a checksum we will ignore in this example.

	 Second last byte is a bitmask of the lights which are in the group.
	 01 = 00000001 = light 1
	 02 = 00000010 = light 2
	 03 = 00000011 = light 1 and 2
	 04 = 00000100 = light 3
	 05 = 00000101 = light 1 and 3
	 06 = 00000110 = light 2 and 3
	 07 = 00000111 = light 1, 2 and 3
	 08 = 00001000 = light 4
	 */
	// Get the single byte we are interested in (the 7th byte) and get its character code decimal value
	var theGroupByte = matchedString.charCodeAt(6);
	// Little debug message just for testing...
	CF.log("Linked Lights: " + ("0"+theGroupByte.toString(16).toUpperCase()).slice(-2));
	var i, mask;
	// Loop through each bit and see if it is high or low
	for (i = 1, mask = 1; i<=8; mask <<= 1, i++) {
		if (theGroupByte & mask) {
			// Bit is high, so set the corresponding digital join high.
			CF.log("Light " + i);
			CF.setJoin("d"+i, 1);
		} else {
			// Bit is low, so set the corresponding digital join low.
			CF.setJoin("d"+i, 0);
		}
	}
}