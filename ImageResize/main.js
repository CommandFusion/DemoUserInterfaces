CF.userMain = function() {
	// Create our httpserver that will return data.
	var dataServer = httpServer("HTTP Server", "HTTP Request");
	// Handle incoming HTTP requests
	dataServer.onRequestReceived = function(request, command, path, headers) {
		// Process the URL
		var imgurl = decodeURIComponent(path.substr(1, path.length));
		// Default processing params
		var params = {
			method: "box",	// crop or box. Crop = crop to fit the desired size. box = resize maintaining ratio (transparent area will be added if required)
			trim: 0,		// trim transparent border pixels or skip trimming
			width: 100,		// Final width of image
			height: 100,	// Final height of image
			valign: "m",	// Vertical alignment of image if box resize results in image wider than the height.
			halign: "c",	// Horizontal alignment of image if box resize results in image taller than the width.
			vcrop: "m",		// Vertical alignment of image to crop from
			hcrop: "c"		// Horizontal alignment of image to crop from
		};
		// Look for any params in the image URL
		if (imgurl.indexOf("?") !== -1) {
			var parts = imgurl.split("?");
			imgurl = parts[0];
			parts = parts[1].split("&");
			for (var i = 0; i < parts.length; i++) {
				var param = parts[i].split("=");
				if (param.length > 1)
					params[param[0]] = param[1];
			}
		}
		// Create the image manipulation object, loading in the asset via given URL
		var img = ImageManipulation(imgurl);
		// Process the image with specific parameters
		img.process({
				trim: parseInt(params.trim, 10),
				method: params.method,
				width: parseInt(params.width, 10),
				height: parseInt(params.height, 10),
				valign: params.valign,
				halign: params.halign,
				vcrop: params.vcrop,
				hcrop: params.hcrop
			},
			function () {
				// Image has been processed, now serve the data back via HTTP
				var response = img.getImage("image/png");
				img.destroy();
				dataServer.sendResponse(response.headers, response.data, true);
		});
	};
	// Start the HTTP server
	dataServer.start();
};
