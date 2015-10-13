/**
 *   ___                              __  __             _             _       _   _
 *  |_ _|_ __ ___   __ _  __ _  ___  |  \/  | __ _ _ __ (_)_ __  _   _| | __ _| |_(_) ___  _ __
 *   | || '_ ` _ \ / _` |/ _` |/ _ \ | |\/| |/ _` | '_ \| | '_ \| | | | |/ _` | __| |/ _ \| '_ \
 *   | || | | | | | (_| | (_| |  __/ | |  | | (_| | | | | | |_) | |_| | | (_| | |_| | (_) | | | |
 *  |___|_| |_| |_|\__,_|\__, |\___| |_|  |_|\__,_|_| |_|_| .__/ \__,_|_|\__,_|\__|_|\___/|_| |_|
 *                       |___/                            |_|                                  v0.1
 *
 * -------------------------------------------------------------------------------------------------
 *
 *  @Author		Arnault RAES <arnault.raes@gmail.com>
 				Jarrod Bell (minor updates)
 *  @Version	0.2 build 20151013
 				0.1 build 20111129
 *  @Home		http://www.arnaultraes.com/CF/
 *
 */


 var ImageManipulation = function(urlImage) {
	// Define the object that will be returned to each instantiation of the class.
    var self = {
        url: urlImage,
		loaded: false,
		img: null,
		canvas: null,
		context: null,
		trimdata: {},
		resizedata: {}
    };

	// This function retrieves the list of parameters to be applied
	// in the image and execute the associated processing
	self.process = function(parameters, callback) {
		// Load the image if it has not yet been loaded
		if (!self.loaded) {
			CF.loadAsset(self.url, CF.BINARY, function (body) {
				// Create the image
				var imgLoad = new Image();
				imgLoad.onload = function() {
					// Store the image after loading
					self.img = imgLoad;
					self.loaded = true;

					// Create the canvas to draw on
					self.canvas = document.createElement('canvas');
					self.canvas.width = this.width;
					self.canvas.height = this.height;
					document.body.appendChild(self.canvas);
					self.context = self.canvas.getContext('2d');

					// Draw the image onto canvas
					self.context.drawImage(self.img, 0, 0, this.width, this.height);

					// Now that image is loaded, process it with user parameters
					self.process(parameters, callback);
				}
				imgLoad.src = "data:image/png"+";base64,"+btoa(body);
			});
		} else {
			// Image is loaded, process it

			// Remove transparent pixels if required
			if (parameters.trim == 1) self.trim();

			// Calculate image resizing
			self.resize(parameters);

			// Draw the updated image
			self.draw(parameters);

			// Finished processing, now continue by calling the callback function
			callback();
		}
	};

	// This function determines the lines of pixels that are transparent edges
	self.trim = function() {
		// Load the image pixel data
		var imageData = self.context.getImageData(0, 0, self.canvas.width, self.canvas.height);
		var data = imageData.data;
		var width = self.canvas.width;

		// Look for entirely transparent rows from top
		var stopScan = false;
		var nbTransparentLineTop = 0;
		for (var y = 0, h = self.canvas.height; y < h && !stopScan; y++) {
			var transparentLine = true;
			for (var x = 0, w = self.canvas.width; x < w && transparentLine; x++) {
				var alpha = data[((width * y) + x) * 4 + 3];
				if (alpha != 0) transparentLine = false;
			}
			if (transparentLine)
				nbTransparentLineTop++;
			else
				stopScan = true;
		}

		// Look for entirely transparent rows from bottom
		var stopScan = false;
		var nbTransparentLineBottom = 0;
		for (var y = self.canvas.height - 1; y >= nbTransparentLineTop && !stopScan; y--) {
			var transparentLine = true;
			for (var x = 0, w = self.canvas.width; x < w && transparentLine; x++) {
				var alpha = data[((width * y) + x) * 4 + 3];
				if (alpha != 0) transparentLine = false;
			}
			if (transparentLine)
				nbTransparentLineBottom++;
			else
				stopScan = true;
		}

		// Look for entirely transparent columbs from left
		var stopScan = false;
		var nbTransparentColLeft = 0;
		for (var x = 0, w = self.canvas.width; x < w && !stopScan; x++) {
			var transparentCol = true;
			for (var y = nbTransparentLineTop-1, h = self.canvas.height - nbTransparentLineBottom; y < h && transparentCol; y++) {
				var alpha = data[((width * y) + x) * 4 + 3];
				if (alpha != 0) transparentCol = false;
			}
			if (transparentCol)
				nbTransparentColLeft++;
			else
				stopScan = true;
		}

		// Look for entirely transparent columbs from right
		var stopScan = false;
		var nbTransparentColRight = 0;
		for (var x = self.canvas.width - 1; x >= nbTransparentColRight && !stopScan; x--) {
			var transparentCol = true;
			for (var y = nbTransparentLineTop-1, h = self.canvas.height - nbTransparentLineBottom; y < h && transparentCol; y++) {
				var alpha = data[((width * y) + x) * 4 + 3];
				if (alpha != 0) transparentCol = false;
			}
			if (transparentCol)
				nbTransparentColRight++;
			else
				stopScan = true;
		}

		// Crop the image if needed
		if (nbTransparentLineTop + nbTransparentLineBottom + nbTransparentColLeft + nbTransparentColRight > 0) {
			// Calculate the new dimensions
			var newWidth = self.canvas.width - nbTransparentColLeft - nbTransparentColRight;
			var newHeight = self.canvas.height - nbTransparentLineTop - nbTransparentLineBottom;

			// Store the info
			self.trimdata = {
				nbTransparentLineTop: nbTransparentLineTop,
				nbTransparentLineBottom: nbTransparentLineBottom,
				nbTransparentColLeft: nbTransparentColLeft,
				nbTransparentColRight: nbTransparentColRight,
				newWidth: newWidth,
				newHeight: newHeight
			};
		}
	};

	// Resize the image based on given parameters
	self.resize = function(parameters) {
		var cwidth = self.trimdata.newWidth ? self.trimdata.newWidth : self.canvas.width;
		var cheight = self.trimdata.newHeight ? self.trimdata.newHeight : self.canvas.height;

		if (parameters.method == "crop") {
			// Reframe by cutting the edges of the image so that there was no transparent area
			var xscale = parameters.width / cwidth;
			var yscale = parameters.height / cheight;
			var scale = Math.min(1, Math.max(xscale, yscale));
			var destWidth = parameters.width;
			var destHeight = parameters.height;
			var destX = 0;
			var destY = 0;
			var sourceWidth = Math.round(parameters.width / scale);
			var sourceHeight = Math.round(parameters.height / scale);

			var nbTransparentColLeft = self.trimdata.nbTransparentColLeft ? self.trimdata.nbTransparentColLeft : 0;
			switch (parameters.hcrop) {
				case "l":
					var sourceX = nbTransparentColLeft;
					break;
				case "c":
					var sourceX = nbTransparentColLeft + Math.round((cwidth - sourceWidth) / 2);
					break;
				case "r":
					var sourceX = nbTransparentColLeft + cwidth - sourceWidth;
					break;
			}

			var nbTransparentLineTop = self.trimdata.nbTransparentLineTop ? self.trimdata.nbTransparentLineTop : 0;
			switch (parameters.vcrop) {
				case "t":
					var sourceY = nbTransparentLineTop;
					break;
				case "m":
					var sourceY = nbTransparentLineTop + Math.round((cheight - sourceHeight) / 2);
					break;
				case "b":
					var sourceY = nbTransparentLineTop + cheight - sourceHeight;
					break;
			}

			// If the destination image is larger than the source image
			if (Math.max(xscale, yscale) > 1) {
				destWidth = Math.min(parameters.width, cwidth);
				destHeight = Math.min(parameters.height, cheight);
				sourceWidth = Math.min(parameters.width, cwidth);
				sourceHeight = Math.min(parameters.height, cheight);

				if (sourceX < nbTransparentColLeft) {
					destX += -sourceX + nbTransparentColLeft
					sourceX = nbTransparentColLeft;
				}
				if (sourceY < nbTransparentLineTop) {
					destY += -sourceY + nbTransparentLineTop
					sourceY = nbTransparentLineTop;
				}
			}
		} else {
			// We crop the image maintaining the ratio to fit in the required size, adding transparent area if required
			var xscale = parameters.width / cwidth;
			var yscale = parameters.height / cheight;
			var scale = Math.min(1, xscale, yscale);
			var sourceX = self.trimdata.nbTransparentColLeft ? self.trimdata.nbTransparentColLeft : 0;
			var sourceY = self.trimdata.nbTransparentLineTop ? self.trimdata.nbTransparentLineTop : 0;
			var sourceWidth = self.trimdata.newWidth ? self.trimdata.newWidth : self.img.width;
			var sourceHeight = self.trimdata.newHeight ? self.trimdata.newHeight : self.img.height;
			var destWidth = Math.round(cwidth * scale);
			var destHeight = Math.round(cheight * scale);

			switch (parameters.halign) {
				case "l":
					var destX = 0
					break;
				case "c":
					var destX = Math.round((parameters.width - destWidth) / 2);
					break;
				case "r":
					var destX = parameters.width - destWidth;
					break;
			}

			switch (parameters.valign) {
				case "t":
					var destY = 0
					break;
				case "m":
					var destY = Math.round((parameters.height - destHeight) / 2);
					break;
				case "b":
					var destY = parameters.height - destHeight;
					break;
			}
		}

		// Store info
		self.resizedata = {
			scale: scale,
			sourceX: sourceX,
			sourceY: sourceY,
			sourceWidth: sourceWidth,
			sourceHeight:sourceHeight,
			destX: destX,
			destY: destY,
			destWidth: destWidth,
			destHeight: destHeight
		};
	};

	// This function allows you to draw the reworked image based on parameters set by the user
	self.draw = function(parameters) {
		// Resize the image
		self.canvas.width = parameters.width;
		self.canvas.height = parameters.height;

		// Draw the image
		self.context.drawImage(self.img, self.resizedata.sourceX, self.resizedata.sourceY, self.resizedata.sourceWidth, self.resizedata.sourceHeight, self.resizedata.destX, self.resizedata.destY, self.resizedata.destWidth, self.resizedata.destHeight);
	};

	// Return previously edited image
	// format="image/jpeg" or "image/png"
	// quality=0.0 - 1.0 (ignored for image/png)
	self.getImage = function(format, quality) {
		var dataURL = self.canvas.toDataURL(format, quality);

		// On deceode les données en base64
		dataURL = atob(dataURL.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""));

		// current date
		var now = new Date();

		// Our structure is created for return via the web server
		var img = {
			headers: {
				Date: now.toGMTString(),
				"Last-Modified": now.toGMTString(),
				"Content-Length": dataURL.length,
				"Content-Type": "image/png"
			},
			data: dataURL
		};
		dataURL = '';
		return img;
	};

	// Delete the items added in the DOM
	self.destroy = function() {
		document.body.removeChild(self.canvas);
	};

	// Return the class instantiation
	return self;
 };