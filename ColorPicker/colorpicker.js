/* Color Picker module for CommandFusion
===============================================================================

AUTHOR:		Sergey Klenov, Jarrod Bell, Florent Pillet, CommandFusion
CONTACT:	support@commandfusion.com
URL:		https://github.com/CommandFusion/
VERSION:	v1.0.2
LAST MOD:	Thursday, 17 November 2011

=========================================================================
HELP:

REQUIRES iViewer v4.0.6

Note: Safari security is very strict, to debug this code you need to use Google Chrome

1. If you want to change the color picker image (you can use any image you like), you need to change it in the GUI file, and also the filename at the bottom of this script.
2. You handle the R,G,B data in the callback defined at the bottom of the script. Settings joins s10, s11 and s12 are just an example of what you can do.
3. To disable the hovering image, remove it from GUI project and send an empty string "" as the hoverJoin parameter to the ColorPicker object
4. To limit the rate that any color data is sent, change the 0 in the "new" call to something larger. 100 means limit rate to sending only every 100ms (ie. 10 times a second).

=========================================================================
*/

// ======================================================================
// Color Picker Object - Create one for each color picker you want in your GUI
// ======================================================================
var ColorPicker = function(url, pickerJoin, hoverJoin, freq, callback) {

	var self = {
		imageURL:	url || "colorpicker.png", // URL to load into the Image object
		freq:		freq || 0, // Frequency, in milliseconds, to limit the communication rate whilst dragging
		can:		null, // Canvas
		img:		null, // Image object
		ctx:		null, // Canvas context
		callback:	callback, // The function to call when new color data is obtained
		hoverJoin: hoverJoin || null, // The join of the image object used as the hover image
		hoverImageData:	{},	// Store info about the hover image for precise positioning later
		lastSend: 0, // Last time the color values were sent, used with freq to limit sending rate
		pickerJoin: pickerJoin || null, // The join of the image object used as the color picker
		pickerData: {} // Data of the picker image such as position on the screen - used to allow the hover image to be located correctly
	};

	self.setup = function () {

		if (self.hoverJoin !== null) {
			CF.getProperties(self.hoverJoin, function(join) {
				self.hoverImageData = join;
			});
		}

		if (self.pickerJoin !== null) {
			CF.getProperties(self.pickerJoin, function(join) {
				self.pickerData = join;
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

		self.img.crossOrigin = '';

		CF.loadAsset(self.imageURL, CF.BINARY, function (data) {
			self.img.src = "data:image/png;base64," + btoa(data);
		}, CF.CACHE);
	};

	self.getColorAt = function (x, y, dolimitRate) {
		// Check if sending too quickly
		if (dolimitRate && (Date.now() - self.lastSend < self.freq)) {
			return;
		}
		// Obtain the color of the pixel at given location. If transparent,
		// do nothing (this way, color pickers don't have to be square -- any transparent pixel
		// will be ignored)
		var pixel = self.ctx.getImageData(x, y, 1, 1);
		if (pixel.data[3] != 0) {
			CF.setProperties({join: self.hoverJoin, x: x - (self.hoverImageData.w / 2) + self.pickerData.x, y: y - (self.hoverImageData.h / 2) + self.pickerData.y});
			self.lastSend = Date.now();
			self.callback(pixel.data[0], pixel.data[1], pixel.data[2], x, y);
		}
	};

	return self;
};

// Push the modules into the startup process
CF.modules.push({name: "Color Picker", object: ColorPicker});

var myColorPicker;
// Only one CF.userMain function in all scripts is allowed!
// If you have one already in your project, consolidate all their contents into one CF.userMain function
CF.userMain = function () {
	myColorPicker = new ColorPicker("colorpicker.png", "s2", "s1", 0, function (r, g, b, x, y) {
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