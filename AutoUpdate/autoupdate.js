var AutoUpdate = function (params) {
	var self = {
		fileURL: params.fileURL || "http://192.168.0.10:8019",
		fileURLCheck: params.fileURLCheck || params.fileURL || "http://192.168.0.10:8019",
		checkInterval: params.checkInterval || 60000,
		lastModifiedToken: params.tokenName || "[last-modified]",
		intervalID: null,
		updateAvailableCallback: params.updateAvailable || null,
		alreadyUpdatedCallback: params.alreadyUpdated || null,
		checkingForUpdateCallback: params.checkingForUpdate || null,
		header: "Last-Modified",
		requestMethod: params.requestMethod || "HEAD",
		lastModInfo: null
	};

	var Etag = "Etag";
	var LastModified = "Last-Modified";

	self.checkForUpdate = function (alwaysConfirm) {
		// Let listeners know we are performing an update check
		if (typeof(self.checkingForUpdateCallback) == typeof(Function)) {
			self.checkingForUpdateCallback(alwaysConfirm);
		}
		// Start the automatic rechecking every x milliseconds if it hasn't already been started
		if (!self.intervalID) {
			self.intervalID = setInterval(self.checkForUpdate, self.checkInterval);
		}

		// First get the last modified date stored in global tokens
		CF.getJoin(CF.GlobalTokensJoin, function(j,v,t) {
			var lastModifiedToken = t[self.lastModifiedToken];
			if (lastModifiedToken === undefined) {
				CF.log("AUTO UPDATE ERROR: Global Token '" + self.lastModifiedToken + "' is missing from your GUI project.");
				return;
			} else {
				CF.log("AUTO UPDATE TOKEN: " + lastModifiedToken);
			}
			// Only convert token value to a date object if the token value is not empty and we got the token value from Last-Modified headers
			if (self.header == LastModified && lastModifiedToken != "") {
				lastModifiedToken = new Date(lastModifiedToken);
			}

			self.getLastModInfo(self.fileURLCheck, function(lastModInfo) {
				// This anonymous function is called when the getLastModInfo function completes
				// Now compare the last mod info to see if it needs reloading
				if ((lastModifiedToken != "") && ((self.header == LastModified && lastModInfo > lastModifiedToken) || (self.header == Etag && lastModInfo != lastModifiedToken))) {
					// GUI needs to be reloaded
					CF.log("UPDATE AVAILABLE!");
					self.lastModInfo = lastModInfo;
					// Show message to user, asking if they wish to update their GUI
					if (typeof(self.updateAvailableCallback) == typeof(Function)) {
						self.updateAvailableCallback();
					}
				} else {
					CF.log("UPDATE NOT REQUIRED: " + ((lastModInfo != null) ? (self.header == LastModified ? lastModInfo.toUTCString() : lastModInfo) : "NULL"));
					// Save new last mod info to global token
					if (lastModInfo) {
						CF.setToken(CF.GlobalTokensJoin, self.lastModifiedToken, (self.header == LastModified ? lastModInfo.toUTCString() : lastModInfo));
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

	// Use HTTP HEAD request to get the last modified info of the GUI File by default.
	// Fallback to HTTP GET requests if HEAD is not supported by server.
	// The HTTP response must issue Last-Modified or Etag headers for this to work (not all servers will do this!)
	self.getLastModInfo = function (fileURL, callback) {
		if (!fileURL || !callback) {
			callback(null);
		}
		CF.request(fileURL, self.requestMethod, null, function(status, headers) {
			if (status == "405") {
				// Try again, using GET method instead, and use GET for all future checks
				self.requestMethod = "GET";
				self.getLastModInfo(fileURL, callback);
			} else if (status != "200") {
				CF.log("AUTO UPDATE ERROR: GUI File URL returned HTTP Code " + status);
				callback(null);
			} else {
				if (headers[LastModified]) {
					self.header = LastModified;
					callback(new Date(headers[LastModified]));
				} else if (headers[Etag]) {
					self.header = Etag;
					callback(headers[Etag]);
				} else {
					CF.log("AUTO UPDATE ERROR: Both the 'Last-Modified' and 'Etag' headers were not sent with reply from the web server hosting the GUI file.");
					callback(null);
				}
			}
		});
	};

	self.doReload = function () {
		if (self.fileURL != "") {
			CF.setToken(CF.GlobalTokensJoin, self.lastModifiedToken, (self.header == "Last-Modified" ? self.lastModInfo.toUTCString() : self.lastModInfo));
			CF.loadGUI(self.fileURL, {reloadGUI: true, reloadAssets: true, reloadAllAssets: true});
		}
	};

	return self;
};