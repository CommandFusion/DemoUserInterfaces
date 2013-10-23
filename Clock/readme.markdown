# CommandFusion iViewer Clock Demo
Demo of an analog clock face animated to the current time using CommandFusion's [iViewer JavaScript API](http://www.commandfusion.com/docs/scripting/index.html).

![Demo Animation](https://raw.github.com/CommandFusion/DemoUserInterfaces/master/Clock/screenshot/clock.gif)

## How It Works
There are separate images for each of the clock hands, and these are rotated based on the current time components (hour, minute, second) which are obtained using the JavaScript Date object.

Every second a function is called to update the hand rotations using the `CF.setProperties` JS API.

**NOTE:** The rotation happens at the center point of an image object, so the clock hand graphics are designed with the center rotation point of the hand in the center of the image, with transparent pixels used to oversize the graphic.

## Demo
Use the GUI File URL below in iViewer settings to load the project into your iOS or Android device:  
http://cmdf.us/clockgui