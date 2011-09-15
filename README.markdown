# CommandFusion Demo User Interfaces #

This repository contains sample GUIs that can be used as an example on specific GUI functionality, and for training.

### Animated Icon
This example shows how you can use multiple frames of an animation within a single image object to create animations.  
The animation in the example is of a light turning on and off.  
The animation frames are provided by [Custom Code Crafters](http://www.customcodecrafters.com/section/17/1/graphics)

### Animated Lists
This example shows how each item in a list can be animated using the CF.setProperties JavaScript method.  
It also shows how you can scroll a list into specific positions via a slider, along with list properties that are available.

### [CEDIA 2011](tree/master/CEDIA%202011)
This is the GUI that was on display at the CEDIA 2011 tradeshow in Sydney, Australia.  
It includes basic JRiver Media Center control, as well as CBus, Dynalite, AirLive IP Camera and Media Portal.  
There is also a video intro showing how video assets could be used in your own GUIs (video files, not streams).

<<<<<<< HEAD
### [List Alpha Bar](tree/master/ListAlphaBar)
=======
### (List Alpha Bar)[tree/master/ListAlphaBar]
>>>>>>> 5572d9b0f7c5494bbaaae2ff12af39890bc05379
This project shows how to use an alphabetical bar to automatically scroll a list based on the letter selected.  
The project uses JavaScript and allows auto-scrolling the list via button press or using a slider.  
This example is created by Darren Vollmer, JAG Electrical Systems, LLC.  
Darren is available for contract CommandFusion programming (see his contact details in the JavaScript for this example).

### Long Short Press
This example shows how you can use advanced button actions and a little JavaScript to create a button that has two actions.  
The button can be used to fire one command on short press, and a different command on long press.  
If the long press is triggered, then the short command won't be. This is accomplished by triggering the short press on release, and cancelling it if the long press is triggered first.

### Subpage Logic
This project shows a few ways that subpages can be controlled on the client side, without interaction with any backend server or device.  
This is accomplished by using loopback prograaming (a system defined using the loopback address of 127.0.0.1).