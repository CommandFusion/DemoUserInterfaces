/*
 * Dead Simple HTTP server code for iViewer
 *
 * Florent Pillet, CommandFusion
 *
 */
var httpServer = function(systemName, feedbackName) {
	var self = {
		system: systemName,
		feedbackItem: feedbackName,
		started: false,
		HTTP_COMMAND_RE: /(\w+) ([^ ]+)/,
		HTTP_HEADER_RE: /(\w+):\s+(.*)/
	};

	// Replace this function after obtaining a server object, to provide
	// your processing callback for incoming requests
	self.onRequestReceived = function(request, command, path, headers) {
		// nothing here. Replace this function in instances of httpServer
		// with your own code
	};

	// Call this function to send the response to a request
	self.sendResponse = function(headers, body, binary) {
		var h = ["HTTP/1.1 200 OK"];
		for (var prop in headers) {
			if (headers.hasOwnProperty(prop)) {
				h.push(prop + ": " + headers[prop]);
			}
		}
		if (headers["Content-Type"] == null) {
			h.push(binary ? "Content-Type: application/unknown" : "Content-Type: text/plain");
		}
		if (headers["Content-Length"] == null) {
			h.push("Content-Length: " + body.length);
		}
		CF.send(self.system, h.join("\r\n") + "\r\n\r\n" + body, binary ? CF.BINARY : CF.UTF8);
	};

	// Call this function to start the server
	self.start = function() {
		if (!self.started) {
			self.started = true;
			CF.watch(CF.FeedbackMatchedEvent, self.system, self.feedbackItem, self.processHTTPRequest);
		}
	};

	// Call this function to stop the server
	self.stop = function() {
		if (self.started) {
			CF.unwatch(CF.FeedbackMatchedEvent, self.system, self.feedbackItem);
			self.started = false;
		}
	};

	// Internal functions
	self.processHTTPRequest = function(system, request) {
		// extract the command, path and headers
		var lines = request.split("[\r\n]");
		if (lines == null || lines.length < 1) {
			return;
		}
		var matches = lines[0].match(self.HTTP_COMMAND_RE);
		if (matches.length != 3) {
			return;
		}
		var command = matches[1];
		var path = matches[2];
		var headers = {};
		var i, n;
		for (i=1, n=lines.length; i < n; i++) {
			matches = lines[i].match(self.HTTP_HEADER_RE);
			if (matches != null && matches.length === 3 && matches[1].length !==0) {
				headers[matches[1]] = matches[2];
			}
		}
		self.onRequestReceived(request, command, path, headers);
	};

	return self;
};

// Push a module, even though we don't have a setup function to call,
// this remains good practice.
CF.modules.push({
	name: "HTTP server",
	object: httpServer
});
