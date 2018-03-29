var myColorPicker;

function decimalToHex(d) {
  var hex = Number(d).toString(16);
  hex = ("00"+ hex).slice(-2);
  return hex;
}

// Only one CF.userMain function in all scripts is allowed!
CF.userMain = function() {

	myColorPicker = new ColorPicker("iphone/iphone-picker.png", "s2", null, 100, function (r, g, b, a, x, y, wasDragged) {
		// This code will be run everytime the pixel color is obtained, along with the pixel data as parameters

		// Force the webpage to refresh itself based on the refresh join assigned to the webpage
		CF.setJoin("s1", "http://localhost:8899/"+r+"-"+g+"-"+b);
	});

	// Setup the colorpicker object after it was created above
	myColorPicker.setup();

	// Create our httpserver that will return data
	var dataServer = httpServer("HTTP_SERVER", "HTTP_REQUEST");

	// Override the function to handle incoming requests
	dataServer.onRequestReceived = function(request, command, path, headers) {
		// This is where you would create the dynamic HTML content to serve up to the web view
		// See this page for details on manipulating the viewport for iOS:
		// http://developer.apple.com/library/IOs/#documentation/AppleApplications/Reference/SafariWebContent/UsingtheViewport/UsingtheViewport.html
		// http://code.google.com/mobile/articles/webapp_fixed_ui.html
		// Get the size of the web view
		CF.getProperties("s1", function (j) {
			var body = "";
			var headers = {};
			//CF.log(request + ", path: " + path);
			//CF.log("Requested path: " + path);
			// Get the dynamic HTML contents, stored in a serial join
			var colors = path.substr(1).split("-");
			if (colors.length != 3) return;
			headers["Content-Type"] = "text/html";
			// Lines ending with a backslash mean to continue to next line. The backslash does not become part of the variable assignment
			body = '\
<html>\n\
	<head>\n\
		<title>Dynamic Background Color</title>\n\
		<meta name="viewport" content="width='+j.width+',initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0" />\n\
	</head>\n\
	<body style="background-color: #' + decimalToHex(colors[0]) + decimalToHex(colors[1]) + decimalToHex(colors[2]) + ';">\n\
	</body>\n\
</html>';
			dataServer.sendResponse(headers, body, false);
		});
	};

	// Start the HTTP Server
	dataServer.start();
};