/* Color Picker module for CommandFusion
===============================================================================

AUTHOR:		Jarrod Bell, CommandFusion
CONTACT:	support@commandfusion.com
URL:		https://github.com/CommandFusion/
VERSION:	v1.0.0
LAST MOD:	Wednesday, 12 October 2011

=========================================================================
HELP:

REQUIRES iViewer v4.0.6

WILL NOT RUN IN DEBUGGER!! See below:

Note that because we are loading image data from the loopback address, this will not work when running in the JS debugger.
So this script only works when running with debugging off.

1. If you want to change the color picker image (you can use any image you like), you need to change it in the GUI file, and also the filename at the bottom of this script.
2. You handle the R,G,B data in the callback defined at the bottom of the script. Settings joins s10, s11 and s12 are just an example of what you can do.
3. Your GUI file must contain a system named "COLORPICKER" (or whatever you change it to in the script) and a feedback item named COLORPICKER_FB
4. The COLORPICKER_FB regex for handling HTTP requests for image data must be: (?msi).*\r\n\r\n
5. To disable the hovering image, remove it from GUI project and send an empty string "" as the hoverJoin parameter to the ColorPicker object

=========================================================================
*/

// ======================================================================
// Color Picker Object - Create one for each color picker you want in your GUI
// ======================================================================
var ColorPicker = function(url, hoverJoin, systemName, callback) {

	var self = {
		imageURL:	url || "colorpicker.png", // URL to load into the Image object
		system:		systemName || "COLORPICKER", // The name of the system in the guiDesigner project used as the HTTP Server
		server:		null, // Color Picker HTTP Server to send the color picker image data to JavaScript
		can:		null, // Canvas
		img:		null, // Image object
		ctx:		null, // Canvas context
		callback:	callback, // The function to call when new color data is obtained
		hoverJoin: hoverJoin || null, // The join of the image object used as the hover image
		hoverImageData:	{},	// Store info about the hover image for precise positioning later
	};

	self.setup = function () {
		// Create the HTTP Server for image data and then start it up
		self.server = new ColorPickerServer(self.system, self.system + "_FB");
		self.server.start();

		if (self.hoverJoin !== null) {
			CF.getProperties(self.hoverJoin, function(join) {
				self.hoverImageData = join;
			});
		}

		// Use HTML Canvas object and HTML Image object to draw the image and get the pixel data to obtain the colors
		self.can = document.createElement("canvas");
		self.ctx = self.can.getContext('2d');
		self.img = new Image();
		// When the image loads, draw it onto the canvas and setup the canvas size
		self.img.onload = function(){
			self.can.width = self.img.width;
			self.can.height = self.img.height;
			self.ctx.drawImage(self.img, 0, 0, self.img.width, self.img.height);
		}
		// Note that because we are loading data from the loopback address, this will not work when running in the JS debugger
		// So this script only works when running with debugging off.
		//self.img.crossOrigin = "";
		self.img.src = "http://127.0.0.1:1234/" + self.imageURL;
	};

	self.getColorAt = function (x, y) {
		var pixel = self.ctx.getImageData(x, y, 1, 1);
		CF.setProperties({join: self.hoverJoin, x: x - (self.hoverImageData.w / 2), y: y - (self.hoverImageData.h / 2)});
		self.callback(pixel.data[0], pixel.data[1], pixel.data[2], x, y);
	};

	return self;
};
// ======================================================================
// Color Picker Server Object - Used by Color Picker object to serve up image data via HTTP from the project cache
// ======================================================================
var ColorPickerServer = function(systemName, feedbackName) {
	var self = {
		system: systemName,
		feedbackItem: feedbackName,
		started: false,
		HTTP_COMMAND_RE: /(\w+) ([^ ]+)/,
		HTTP_HEADER_RE: /(\w+):\s+(.*)/
	};

	self.onRequestReceived = function(request, command, path, headers) {
		CF.log("Request: " + path);
		if (path == "/colorpicker.png") {
			// Respond with the data from the image
			CF.loadAsset("colorpicker.png", CF.BINARY, function (data) {
				CF.log("loadAsset callback data length: " + data.length);
				self.sendResponse({"Content-Type": "image/png"}, data, true);
			});
		}		
	};

	// Call this function to send the response to a request
	self.sendResponse = function(headers, body, binary) {
		var h = ["HTTP/1.1 200 OK"];
		for (var prop in headers) {
			if (headers.hasOwnProperty(prop)) {
				h.push(prop + ": " + headers[prop]);
			}
		}
		if (headers["Access-Control-Allow-Origin"] == null) {
			h.push("Access-Control-Allow-Origin: *");
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
		CF.log("teststt");
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

// Push the modules into the startup process
CF.modules.push({name: "Color Picker Server", object: ColorPickerServer});
CF.modules.push({name: "Color Picker", object: ColorPicker});

var myColorPicker;
// Only one CF.userMain function in all scripts is allowed!
// If you have one already in your project, consolidate all their contents into one CF.userMain function
CF.userMain = function () {
	myColorPicker = new ColorPicker("colorpicker.png", "s1", "COLORPICKER", function (r, g, b, x, y) {
		// This code will be run everytime the pixel color is obtained, along with the pixel data as parameters
		//CF.log("R: " + r + ", G: " + g + ", B: " + b);
		CF.setJoins([
			{join: "s10", value: r},
			{join: "s11", value: g},
			{join: "s12", value: b}
		]);
	});
	// Setup the colorpicker object after it was created above
	myColorPicker.setup();
};