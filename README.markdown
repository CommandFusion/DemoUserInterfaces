# CommandFusion Demo User Interfaces #

This repository contains sample GUIs that can be used as an example on specific GUI functionality, and for training.

### [Animated Icon](DemoUserInterfaces/tree/master/Animated%20Icon)
This example shows how you can use multiple frames of an animation within a single image object to create animations.  
The animation in the example is of a light turning on and off.  
The animation frames are provided by [Custom Code Crafters](http://www.customcodecrafters.com/section/17/1/graphics)  
Updated to now also include a simple loading spinner using a single image and rotating the image object via JavaScript CF.setProperties.

### [Animated Lists](DemoUserInterfaces/tree/master/Animated%20Lists)
This example shows how each item in a list can be animated using the CF.setProperties JavaScript method.  
It also shows how you can scroll a list into specific positions via a slider, along with list properties that are available.

### [Back Button](DemoUserInterfaces/tree/master/BackButton)
An example on how to use a global token to track what subpage you were last viewing, so that you can use a back button to activate the correct subpage.  
Created by Darren Vollmer (contact details in the GUI about page).

### [CEDIA 2011](DemoUserInterfaces/tree/master/CEDIA%202011)
This is the GUI that was on display at the CEDIA 2011 tradeshow in Sydney, Australia.  
It includes basic JRiver Media Center control, as well as CBus, Dynalite, AirLive IP Camera and Media Portal.  
There is also a video intro showing how video assets could be used in your own GUIs (video files, not streams).

### [Color Picker](DemoUserInterfaces/tree/master/ColorPicker)
This demo shows you how to create a color picker using JavaScript and Gestures.  
Any image can be used and it's pixel color data obtained by tapping or dragging around the image.  
Note that this demo will not run in debugger due to requiring localhost JavaScript HTTP requests to serve the image data from cache.

### [Data Logging](DemoUserInterfaces/tree/master/DataLogging)
This demo shows you how to log incoming data and display it in an auto-scrolling list.  
The data is parsed and can show non-printable characters in ASCII representation such as \x0D for carriage return.  
Any prefix and/or suffix can be added to the hex data representation as you desire.

### [Dial / Knob](DemoUserInterfaces/tree/master/Dial)
This demo shows you how to create a volume dial or knob using JavaScript and Gestures.  
More details are available in the README and top of the dial.js file.

### [Dynamic Room List](DemoUserInterfaces/tree/master/DynamicRoomList)
Use HTTP Requests and an XML file to generate a dynamic room list, allowing for multiple levels and rooms in each level.  
Simply change the XML and your room listing will update accordingly.  
Page flip to the room on select.

### [List Alpha Bar](DemoUserInterfaces/tree/master/ListAlphaBar)
This project shows how to use an alphabetical bar to automatically scroll a list based on the letter selected.  
The project uses JavaScript and allows auto-scrolling the list via button press or using a slider.  
This example is created by Darren Vollmer, JAG Electrical Systems, LLC.  
Darren is available for contract CommandFusion programming (see his contact details in the JavaScript for this example).

### [Long Short Press](DemoUserInterfaces/tree/master/LongShortPress)
This example shows how you can use advanced button actions and a little JavaScript to create a button that has two actions.  
The button can be used to fire one command on short press, and a different command on long press.  
If the long press is triggered, then the short command won't be. This is accomplished by triggering the short press on release, and cancelling it if the long press is triggered first.

### [Matrix Switcher](DemoUserInterfaces/tree/master/MatrixSwitcher)
This example shows a basic concept of using Loopback processing (sending data back to itself) in order to do complex actions.  
The matrix example here uses loopback data remember input selection, then when an output is chosen, route the selected input to that output using a ficticious protocol.  
For any real matrix switcher, you would first have to adjust the "Matrix Switcher" system to talk to the correct address, then adjust the "Output" commands to use the correct protocol format for your switcher.

### [Mouse Coordinates](DemoUserInterfaces/tree/master/MouseCoords)
This example shows how to use Gestures and JavaScript to update two analog joins based on the x and y position touched or dragged on an image.  
This is a fundamental example on how to iViewer could be used to control a mouse on an external system.  
The example also shows how to use inline JavaScript calls on buttons, gestures and commmands, as well as the use of persistent tokens to show/hide an object on startup.  
Furthermore, it makes use of Math Expressions to set the analog join values based on min and max ranges of the gesture area and analog joins.

### [Multi-Mode Manager](DemoUserInterfaces/tree/master/MultiModeManager)
This example shows how you can use JavaScript to emulate the Multi-Mode feature of Crestron touch panels.  
See the JavaScript file for instructions on how to use this JavaScript module.  
Note that this requires iViewer v4.0.6 or higher.

### [Multiple Slider Commands](DemoUserInterfaces/tree/master/MultipleSliderCommands)
This example shows how you can use loopback programming methods to effectively send multiple slider commands from a single slider.  
The slider first sends a single command to the loopback system, which then in turn uses a feedback item to match the incoming slider command and send two separate commands to the external system via on match items in the feedback processing order.

### [Scrolling Text](DemoUserInterfaces/tree/master/ScrollingText)
This example shows how JavaScript can be used to create a scrolling text box in your GUI.  
The GUI also shows how you can use input fields to change settings on the fly for the scrolling text module.  
See the JavaScript comments for specific details on the parameters you can use.

### [Subpage Logic](DemoUserInterfaces/tree/master/SubpageLogic)
This project shows a few ways that subpages can be controlled on the client side, without interaction with any backend server or device.  
This is accomplished by using loopback programming (a system defined using the loopback address of 127.0.0.1).