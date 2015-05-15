# Toggle Fullscreen Objects
This demo shows how to toggle fullscreen between a group of objects.  
Useful for showing a number of small camera feeds, then tapping one to make it fullscreen.  
Tap it again to toggle back out of fullscreen mode.

The script checks the position of the tapped image object to know if it is in fullscreen or not.  
This is determined by if the object is in the top left, it must be fullscreen, otherwise its in small windowed mode.

## How To Use
Edit the `streamtoggle.js` file to adjust the group of objects you want to toggle between.
This should be an array of joins that are part of the toggle group, ie. the joins of each small camera feed image object.

Each object must be in this array, otherwise the script will not hide the small window objects, and the z-order (depth) might interfere with the one being made fullscreen.