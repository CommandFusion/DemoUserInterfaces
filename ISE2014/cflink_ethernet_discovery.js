var CFLink_Discovery = {
	devices: {},
	systemName: "CFLINK_DISCOVERY",
	feedbackName: "IncomingCFLinkDiscoveryData",
	deviceDiscovered: null,

	rescan: function() {
		CFLink_Discovery.devices = {};
		CFLink.buildMsg(this.systemName, "FF", "Q", "LAN", "WHO");
		// Send the discovery message a few times to make sure UDP doesnt mess up
		setTimeout(function(me) {CFLink.buildMsg(me.systemName, "FF", "Q", "SOL", "WHO");}, 500, this);
		// Discovery for the Solo is done here too
		setTimeout(function(me) {CFLink.buildMsg(me.systemName, "FF", "Q", "LAN", "WHO");}, 1000, this);
		setTimeout(function(me) {CFLink.buildMsg(me.systemName, "FF", "Q", "SOL", "WHO");}, 1500, this);
		setTimeout(function(me) {CFLink.buildMsg(me.systemName, "FF", "Q", "LAN", "WHO");}, 2000, this);
		setTimeout(function(me) {CFLink.buildMsg(me.systemName, "FF", "Q", "SOL", "WHO");}, 2500, this);
	},

	incomingData: function(feedbackName, data) {
		// Process the WHO reply
		var matches = CFLink.baseReplyRegex.exec(data);
		if (matches) {
			// Look for WHO replies, with data
			if (matches[4] == "WHO" && matches[5]) {
				// Get the device, which creates it if not already existing
				var config = matches[5].split(':');
				// model = config[0], serial = config[1], firmwareVer = config[2], protocolVer = config[3]
				var device = CFLink._createDevice(matches[1].charCodeAt(0).toString(16), config[0], CFLink.systemName, matches[5], true);
				if (CFLink_Discovery.devices[device.serialNum]) {
					// Device already discovered!
					CF.log("Device already discovered!");
					return;
				}
				// Check for prototype units with invalid serial numbers
				if (device.serialNum != config[1]) {
					// The original serial number must have been invalid, so its a prototype unit
					// So now lets compare the IP address with already found devices and see if its unique
					for (var serialNum in CFLink_Discovery.devices) {
						if (CFLink_Discovery.devices[serialNum].ipAddress == device.ipAddress) {
							CF.log("Prototype device already discovered!");
							return;
						}
					}
				}
				CFLink_Discovery.devices[device.serialNum] = device;
				if (typeof CFLink_Discovery.deviceDiscovered == "function") {
					CFLink_Discovery.deviceDiscovered(CFLink_Discovery.systemName, device, true);
				}
			} else {
				CF.log("CFLink Discovery: NON-WHO REPLY DETECTED");
			}
		}
	},

	deviceCount: function() {
		var size = 0, key;
		for (key in CFLink_Discovery.devices) {
			if (CFLink_Discovery.devices.hasOwnProperty(key)) size++;
		}
		return size;
	}
};