# Dial / Knob Demo

This demonstration GUI is designed to showcase the ability to create dials, volume knobs, etc, making heavy use of the powerful JavaScript API available in iViewer.

## Usage

1. Add the dial.js file to your [guiDesigner](http://www.commandfusion.com/guidesigner.html) project.
2. Add the main.js file to your guiDesigner project. If you already have a main.js for some other use, you can merge the contents of them without issue.
3. Edit the main.js to configure your settings
4. Create a function to be notified when the dial rotation changes so that you can use the rotation angle parameter to control external systems any way you need.

### Example code to create your own dial JavaScript object:
```javascript
// Custom parameters
var newDial = new Dial("s1", callbackFunction, {srcJoin: "s2", maxTime: 0.5, minTime: 0.3, angleOffset: -45, maxAngle: 260});
// Default parameters - just need to supply join number for the object to rotate and the callback function to be notified when the dial rotates:
var newDial2 = new Dial("s10", callbackFunction);

function callbackFunction(newAngle) {
	// This function will be called when the dial rotation angle changes.
	// Do something with the new angle variable, such as control a light or something.
	CF.send("My Lighting System", "light(1)=" + newAngle); // Sample of sending the angle to the system as part of a direct send command.
}
```

## Video Demo

[Watch video demo on YouTube](http://www.youtube.com/watch?v=jSSfOCH8hmg)

## Technical Implementation Details

The volume knob is made up of only two images - one for the dial markings and dial shadow, the other for the actual metallic dial itself.  
The dial image itself is rotated using the iViewer JavaScript API and the [CF.setProperties method](http://www.commandfusion.com/docs/scripting/gui.html#cF.setProperties), along with the zrotation parameter.

The rotation via touch is performed using gestures attached to the dial background image.  
This, and some trigonometry math in JavaScript, allows a Pan gesture on the image to calculate the required angle to rotate the image to, based on the touch point on the image.

**Other points of note:**

1. The slider min and max value settings specific the min and max angles to rotate to when using the slider method to rotate the dial.
1. Repeat rate above zero on the + and - buttons allows press & hold functionality of the buttons to continuously call the JavaScript increment/decrement rotation functions.
1. There are @2x images in the demo GUI that Apple devices with [Retina displays will automatically load](http://www.commandfusion.com/wiki/index.php?title=Apple_Retina_Displays) when required. But in guiDesigner, the layout always uses the non-@2x images.