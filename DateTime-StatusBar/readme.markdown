# DateTime Driver and Status Bar Demo

This demonstration GUI is designed to show how to create a clock or date object in your GUI.  
Using the DateTimeDriver module you can show a clock or date anywhere in your GUI.

You can also show the default status bar for your device by using the statusbar module included in this demo.  
This would show the time, as well as battery level, wifi status, etc.

The date.js script is an open source JavaScript library, [available](http://www.datejs.com/) under the MIT license.  
For a brief overview of this library, see the links in their [github repo README](https://github.com/datejs/Datejs).  
See the date formatting string options in the [dateJS documentation](http://code.google.com/p/datejs/wiki/FormatSpecifiers).

## Usage

1. Add the date.js file to your [guiDesigner](http://www.commandfusion.com/guidesigner.html) project.
1. Add the datetime.js file to your guiDesigner project.
1. Optionaly, add the statusbar.js file to your guiDesigner project if you wish to control the default status bar for your device.
1. Add the main.js file to your guiDesigner project.
1. Edit the main.js to configure/start your date/time objects.
1. Optionally, add JavaScript calls to buttons to start/stop/toggle the date/time objects.

## Other Languages

The date.js package used in this demo is available in over 150+ culture-specific files.

For languages other than english US, [download the JavaScript file](https://github.com/datejs/Datejs/tree/master/build) for various cultures.  
Then replace the date.js used in this demo with one of the other .js files, such as 'date-de-DE.js' (German/Deutsch).  
'date.js' in this demo is the same as 'date-en-US.js'.