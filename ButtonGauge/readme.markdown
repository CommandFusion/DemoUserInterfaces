# Button Gauge Demo

This demonstration GUI is designed to show how to create a 'gauge-like' object using multiple buttons.  
This is useful for when you need specific commands to be sent based on position touched within a gauge.  
Note that this method will result in losing the ability to slide up and down the gauge area. Instead, the user has to tap the position in the 'gauge' to set the level.

## Usage

1. Add the main.js file to your [guiDesigner](http://www.commandfusion.com/guidesigner.html) project.
2. Edit the main.js to configure your min and max digital join ranges.
3. Add the JavaScript call to each button in the 'gauge' (as below).
4. Add your commands as per normal to each button in the 'gauge'. In the demo, there are some basic loopback commands attached to buttons as an example.

```javascript
// Add this single line of code to each of the buttons in the 'gauge'.
// The join variable will be used to automatically set the gauge to the correct level based on the join of the button sending the script.
// This join variable is automatically created for any JavaScript calls from buttons - http://www.commandfusion.com/docs/scripting/startup.html#button_javascript_action
setGaugeLevel(join);
```

## Technical Details

The 'gauge' is made up of 10 individual buttons, each sending their own commands and JavaScript calls.  
The JavaScript handles keeping all button states in sync.  
The example loopback system and commands are used to update the text display at the top of the 'gauge'.  
The mute button works simply by assigning it a join number below the min join range defined in the JavaScript and attaching the same JavaScript function call as used by the other 'gauge' buttons.