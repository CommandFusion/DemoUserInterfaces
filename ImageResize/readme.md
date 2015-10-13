# Image Resize & Cropping Demo
This demo project shows you how you can resize or crop images to suit a specific pixel size, on the fly, using JavaScript.

## Credits
The original image manipulation script was written by [Arnault Raes](http://www.arnaultraes.com/CF/).

## Usage
1. Add the three JavaScript files to your project via the script manager.
1. Add the TCP Server system to your project along with its feedback.
	- Easiest way to achieve that is to open the sample project and your own project in the same guiDesigner window.
	- Then copy the system from the sample project, select your own project, and right click in the system manager to paste.
1. Set the URL of an image object to point to `http://localhost:10210/` followed by the name of an image in the project cache (or the full URL to fetch it from).
	- Example: `http://localhost:10210/cover.jpg`
	- The URL can use params to set the desired resize options (see the [main.js file](https://github.com/CommandFusion/DemoUserInterfaces/blob/master/ImageResize/main.js#L9) for more details):
	- Example: `http://localhost:10210/cover.jpg?width=200&height=200&method=box`

See the "CROP TO FIT" and "SCALE TO FIT" buttons in the GUI file for examples on how to use the scripts.

## How it works
Behind the scenes, the scripts are running a web server, which receives the image URL request, then loads the image from cache (or loads it from the internet if required) and finally uses JavaScript to process the pixel data and send a HTTP response via the web server with the final processed pixel data.