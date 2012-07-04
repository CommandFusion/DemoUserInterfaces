# Dial / Knob Demo

This demonstration GUI is designed to showcase the ability to create dials, volume knobs, etc, making heavy use of the powerful JavaScript API available in iViewer.

## Usage

1. Add the dial.js file to your [guiDesigner](http://www.commandfusion.com/guidesigner.html) project.
2. Edit the dial.js to configure your settings at the very end of the code

### Example code to create your own dial JavaScript object:
```javascript
// Custom parameters
var newDial = new Dial("s1", {srcJoin: "s2", maxTime: 0.5, minTime: 0.3, angleOffset: -45, maxAngle: 260});
// Default parameters - just need to supply join number for the object to rotate
var newDial2 = new Dial("s10");
```

## Video Demo

[Watch video demo on YouTube]()

## Technical Implementation Details

The volume knob is made up of only two images - one for the dial markings and dial shadow, the other for the actual metallic dial itself.  
The dial image itself is rotated using the iViewer JavaScript API and the [CF.setProperties method](http://www.commandfusion.com/docs/scripting/gui.html#cF.setProperties), along with the zrotation parameter.

The rotation via touch is performed using gestures attached to the dial background image.  
This, and some trigonometry math in JavaScript, allows a Pan gesture on the image to calculate the required angle to rotate the image to, based on the touch point on the image.

Other points of note:

1. The slider min and max value settings specific the min and max angles to rotate to when using the slider method to rotate the dial.
1. Repeat rate above zero on the + and - buttons allows press & hold functionality of the buttons to continuously call the JavaScript increment/decrement rotation functions.
1. There are @2x images in the demo GUI that Apple devices with [Retina displays will automatically load](http://www.commandfusion.com/wiki/index.php?title=Apple_Retina_Displays) when required. But in guiDesigner, the layout always uses the non-@2x images.