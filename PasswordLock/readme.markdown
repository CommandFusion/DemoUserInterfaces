# Passwork Lock Module
Use this module in your iViewer projects to add simple password validation for your users.

By default the module will perform a page flip when correct password is entered, but you could change this to do whatever you need within the JavaScript.

## Usage
1. Edit the serial join number that the password text will show in, this is right at the top of the JavaScript. By default it is set to `s1`, but change it to match the serial join of a text object in your GUI.
2. Add the PassLock.js script to your project via the Script Manager.
3. Configure the Global Tokens to include:
	* `[password]` = the valid password. Eg. `1234`.
	* `[passSuccessPage]` = the name of the page to flip to when password is entered correctly. Eg. `Welcome`. This page must exist in your project.
4. Add the buttons to your password entry screen, and call the `PassLock.keyPress` and `PassLock.clear` JavaScript functions as required.

## Demo
Open up the passwordlock.gui file in guiDesigner and run it on your device to see it in action. You can see the appropriate JavaScript calls to place on your buttons in this demo.