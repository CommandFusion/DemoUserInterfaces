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

=========================================================================
*/

// ======================================================================
// Color Picker Object - Create one for each color picker you want in your GUI
// ======================================================================
var ColorPicker = function(url, hoverJoin, systemName, callback) {

	var self = {
		imageURL:	url || "colorpicker.png", // URL to load into the Image object
		can:		null, // Canvas
		img:		null, // Image object
		ctx:		null, // Canvas context
		callback:	callback, // The function to call when new color data is obtained
		hoverJoin: hoverJoin || null, // The join of the image object used as the hover image
		hoverImageData:	{},	// Store info about the hover image for precise positioning later
	};

	self.setup = function () {

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
		
		self.img.crossOrigin = '';
			
		CF.loadAsset(self.imageURL, CF.BINARY, function (data) {
			self.img.src = "data:image/png;base64," + encode64(data);
		});
	};

	self.getColorAt = function (x, y) {
		// Obtain the color of the pixel at given location. If transparent,
		// do nothing (this way, color pickers don't have to be square -- any transparent pixel
		// will be ignored)
		var pixel = self.ctx.getImageData(x, y, 1, 1);
		if (pixel.data[3] != 0) {
			CF.setProperties({join: self.hoverJoin, x: x - (self.hoverImageData.w / 2), y: y - (self.hoverImageData.h / 2)});
			self.callback(pixel.data[0], pixel.data[1], pixel.data[2], x, y);
		}
	};

	return self;
};

function encode64(input) {
	var output = "";
	var chr1, chr2, chr3 = "";
	var enc1, enc2, enc3, enc4 = "";
	var i = 0;
	
	var keyStr = "ABCDEFGHIJKLMNOP" +
                "QRSTUVWXYZabcdef" +
                "ghijklmnopqrstuv" +
                "wxyz0123456789+/" +
                "=";

	do {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) enc3 = enc4 = 64;
		else if (isNaN(chr3)) enc4 = 64;

		output = output +
		keyStr.charAt(enc1) +
		keyStr.charAt(enc2) +
		keyStr.charAt(enc3) +
		keyStr.charAt(enc4);
		chr1 = chr2 = chr3 = "";
		enc1 = enc2 = enc3 = enc4 = "";
	} while (i < input.length);

	return output;
}

// Push the modules into the startup process
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