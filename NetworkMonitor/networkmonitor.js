var NetworkMonitor = function(params) {
	var self = {
		ssid: params.ssid || "",
		systemName: params.systemName || "",
		localIP: params.localIP || null,
		localPort: params.localPort || null,
		remoteIP: params.remoteIP || null,
		remotePort: params.remotePort || null,
		watcherID: null,
		networkChangeCallback: params.networkChangeCallback || null
	};

	self.init = function () {

		if (!ssid) {
			CF.log("Network Monitor: SSID param is undefined or invalid.");
			return;
		}

		// First get the initial system state, this will be stored as the local state
		if (!systemName) {
			CF.log("Network Monitor: systemName param is undefined.");
			return;
		}

		if (!CF.systems.hasOwnProperty(self.systemName)) {
			CF.log("Network Monitor: System could not be found in project: " + self.systemName);
			return;
		}

		if (!self.ssid.constructor === Array) {
			self.ssid = self.ssid.split(",");
		}

		// Check if using specifically defined local connection details or automatically get them from the initial system state
		if (!self.localIP || !self.localPort) {
			// Get the initial system state as the local address details
			self.localIP = CF.systems[self.systemName].address;
			self.localPort = CF.systems[self.systemName].port;
		}

		// Setup network connection listener
		self.watcherID = CF.watch(CF.NetworkStatusChangeEvent, "", function(networkStatus) {
			if (!networkStatus.hasNetwork) {
				CF.log("Network is unavailable!");
				if (typeof self.networkChangeCallback === 'function' && self.networkChangeCallback(networkStatus.hasNetwork))
				return false;
			}

			// Check if the current SSID matches the ssid module parameter
			var wifiMatch = false;
			for (var i = 0; i < self.ssid.length; i++) {
				if (CF.networkSSID.toLowerCase().trim() == self.ssid[i].toLowerCase().trim()) {
					wifiMatch = true;
					continue;
				}
			}

			CF.log("Network Monitor: Wi-Fi Match = " + (wifiMatch ? "YES" : "NO"));

			if (wifiMatch) {
				CF.setSystemProperties(self.systemName, {address: self.localIP, port: self.localPort});
			} else {
				CF.setSystemProperties(self.systemName, {address: self.remoteIP, port: self.remotePort});
			}
		}, true);
	};

	return self;
};


// Example usage:
var monitor;
CF.userMain = function () {
	// Single SSID
	//monitor = new NetworkMonitor({ssid: "linksys", systemName: "my system", remoteIP: "my.dyndns.org", remotePort: 1234});

	// Multiple SSIDs as string
	//monitor = new NetworkMonitor({ssid: "linksys, home, home2", systemName: "my system", remoteIP: "my.dyndns.org", remotePort: 1234});

	// Multiple SSIDs as array
	//monitor = new NetworkMonitor({ssid: ["linksys", "home", "home2"], systemName: "my system", remoteIP: "my.dyndns.org", remotePort: 1234});

	// Or with a function to call dynamic code when network is unavailable:
	monitor = new NetworkMonitor({
		ssid: "linksys",
		systemName: "my system",
		remoteIP: "my.dynddns.org",
		remotePort: 1234,
		networkChangeCallback: function(hasNetwork) {
			// Network status changed, run your own code

			// Show or hide a subpage assigned to a tag 'networkUnavailable' based on network state.
			CF.setJoin("networkUnavailable", !hasNetwork);
		}
	});
};