var AutoUpdate = function (params) {
	var self = {
		fileURL: params.fileURL || "http://192.168.0.10:8019",
		checkInterval: params.checkInterval || 60000,
		lastModifiedToken: params.tokenName || "[last-modified]",
		intervalID: null,
		updateAvailableCallback: params.updateAvailable || null,
		alreadyUpdatedCallback: params.alreadyUpdated || null,
		newDate: null
	};

	self.checkForUpdate = function (alwaysConfirm) {
		if (!self.intervalID) {
			// Start the automatic rechecking every x milliseconds
			self.intervalID = setInterval(self.checkForUpdate, self.checkInterval);
		}

		// First get the last modified date stored in global tokens
		CF.getJoin(CF.GlobalTokensJoin, function(j,v,t) {
			var lastModified = t[self.lastModifiedToken];
			if (!lastModified) {
				CF.log("AUTO UPDATE ERROR: Global Token '" + self.lastModifiedToken + "' is missing from your GUI project.");
				return;
			}
			lastModified = new Date(lastModified);
			// Use HTTP HEAD request to get the last modified date of the GUI File
			// The HTTP response must issue Last-Modified headers for this to work (not all servers will do this!)
			self.getLastModDate(self.fileURL, function(newDate) {
				// This anonymous function is called when the getLastModDate function completes
				// Now compare the dates to see if it needs reloading
				if (newDate > lastModified) {
					// GUI needs to be reloaded
					CF.log("UPDATE AVAILABLE!");
					self.newDate = newDate;
					// Show message to user, asking if they wish to update their GUI
					if (typeof(self.updateAvailableCallback) == typeof(Function)) {
						self.updateAvailableCallback();
					}
				} else {
					CF.log("UPDATE NOT REQUIRED: " + ((newDate != null) ? newDate.toUTCString() : "NULL"));
					// Save new date to global token
					if (newDate) {
						CF.setToken(CF.GlobalTokensJoin, self.lastModifiedToken, newDate.toUTCString());
					}
					// Only show the confirmation dialog if we manually requested a dialog if already up to date
					if (alwaysConfirm) {
						if (typeof(self.alreadyUpdatedCallback) == typeof(Function)) {
							self.alreadyUpdatedCallback();
						}
					}
				}
			});
		});
	};

	self.getLastModDate = function (fileURL, callback) {
		if (!fileURL || !callback) {
			callback(null);
		}
		CF.request(fileURL, "HEAD", null, function(status, headers) {
			if (status != "200") {
				CF.log("AUTO UPDATE ERROR: GUI File URL returned HTTP Code " + status);
				callback(null);
			} else {
				if (!headers['Last-Modified']) {
					CF.log("AUTO UPDATE ERROR: Last-Modified header was not sent with reply from the web server hosting the GUI file.");
					callback(null);
				} else {
					callback(new Date(headers['Last-Modified']));
				}
			}
		});
	};

	self.doReload = function () {
		if (self.fileURL != "") {
			CF.setToken(CF.GlobalTokensJoin, self.lastModifiedToken, self.newDate.toUTCString());
			CF.loadGUI(self.fileURL, {reloadGUI: true, reloadAssets: true, reloadAllAssets: true});
		}
	};

	return self;
};