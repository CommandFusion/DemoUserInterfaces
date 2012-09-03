var Logger = function(systemName, feedbackName, listJoin) {
	var self = {
		systemName: systemName || "",
		feedbackName: feedbackName || "",
		listJoin: listJoin
	};

	self.init = function() {
		if (self.feedbackName == "") {
			CF.log("Logger defined without a feedback name. You must supply the name of the feedback item you wish to log incoming data for.");
			return;
		}
		CF.watch(CF.FeedbackMatchedEvent, self.systemName, self.feedbackName, self.parseData);
	};

	self.parseData = function(regex, data) {
		// First show the raw data in the logger output
		CF.log(data);

		// Now show it in hex formats
		var hexAscii = "", hexHybrid = "";
		for (aByte in data) {
			hexAscii = hexAscii + self.logHexAscii(data[aByte], true, "\\x");
			if (data[aByte].charCodeAt(0) < 32 || data[aByte].charCodeAt(0) > 126) {
				hexHybrid = hexHybrid + self.logHexAscii(data[aByte], true, "\\x");
			} else {
				hexHybrid = hexHybrid + data[aByte];
			}
		}

		// Hybrid will only use hex notation for non-printable characters
		CF.log(hexHybrid);
		// Hex Ascii will use hex notation for all characters
		CF.log(hexAscii);
		// Show the log in the GUI if required also
		if (self.listJoin) {
			// Test if we should scroll to the bottom of the log
			CF.listInfo(self.listJoin, function(list, count, first, numVisible) {
				// Add the item after we have the visible count details from the listInfo call
				CF.listAdd(self.listJoin, [{"s1": hexHybrid, "s2": new Date().toString("dd/MM/yy\nhh:mm:ss")}]);
				// Check what items are visible
				if (first+numVisible >= count) {
					// We can see the last list item, so auto scroll
					CF.listScroll(self.listJoin, count, CF.VisiblePosition, true, true);
				}
			})
		}
	};

	self.logHexAscii = function(data, upperCase, prefix, suffix) {
		(upperCase === undefined) ? upperCase = false : upperCase = upperCase;
		(prefix === undefined) ? prefix = "" : prefix = prefix;
		(suffix === undefined) ? suffix = "" : suffix = suffix;
		if (upperCase) {
			return (prefix + ("0"+data.charCodeAt(0).toString(16)).slice(-2).toUpperCase() + suffix);
		} else {
			return (prefix + ("0"+data.charCodeAt(0).toString(16)).slice(-2) + suffix);
		}
	};

	self.clear = function() {
		if (self.listJoin) {
			CF.listRemove(self.listJoin);
		}
	};

	return self;
};