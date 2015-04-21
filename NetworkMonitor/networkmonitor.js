var NetworkMonitor = function(params) {
	var self = {
		ssid: params.ssid || "",
		systemName: params.systemName || "",
		localIP: params.localIP || null,
		localPort: params.localPort || null,
		remoteIP: params.remoteIP || null,
		remotePort: params.remotePort || null,
		networkChangeCallback: params.networkChangeCallback || null,
		statusJoin: params.statusJoin || null
	};

	self.init = function () {

		if (!self.ssid) {
			CF.log("Network Monitor: SSID param is undefined or invalid.");
			return;
		}

		// First get the initial system state, this will be stored as the local state
		if (!self.systemName) {
			CF.log("Network Monitor: systemName param is undefined.");
			return;
		}

		if (!CF.systems.hasOwnProperty(self.systemName)) {
			CF.log("Network Monitor: System could not be found in project: " + self.systemName);
			return;
		}

		if (!Array.isArray(self.ssid)) {
			self.ssid = self.ssid.split(",");
		}

		// Check if using specifically defined local connection details or automatically get them from the initial system state
		if (!self.localIP || !self.localPort) {
			// Get the initial system state as the local address details
			self.localIP = CF.systems[self.systemName].address;
			self.localPort = CF.systems[self.systemName].port;
		}

		// Setup network connection listener
		CF.watch(CF.NetworkStatusChangeEvent, "", function(networkStatus) {
			if (!networkStatus.hasNetwork) {
				CF.log("Network is unavailable!");
				CF.setJoin(self.statusJoin, "Network is unavailable!");
				(self.networkChangeCallback || Function)(networkStatus);
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
				CF.setJoin(self.statusJoin, CF.networkSSID + ", " + self.localIP + ":" + self.localPort);
			} else {
				CF.setSystemProperties(self.systemName, {address: self.remoteIP, port: self.remotePort});
				CF.setJoin(self.statusJoin, (CF.networkSSID ? CF.networkSSID : networkStatus.networkType) + ", " + self.remoteIP + ":" + self.remotePort);
			}
			
			(self.networkChangeCallback || Function)(networkStatus);
		}, true);
	};

	return self;
};