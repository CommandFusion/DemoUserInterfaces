/*  Frame based animation module for CommandFusion
===============================================================================

AUTHOR:		Jarrod Bell, CommandFusion
CONTACT:	support@commandfusion.com
URL:		https://github.com/CommandFusion/DemoUserInterfaces
VERSION:	v0.1.0
LAST MOD:	14 June 2011

=========================================================================
HELP:

Create as many animated icons in your project as you require.
Simply add them at the bottom of this script with a unique variable name
eg. Anim1, Anim2, Anim3, etc.

Then on your buttons (or gestures, commands, etc) call the desired
animation's startAnim and stopAnim functions like so:
Anim1.startAnim()
Anim1.stopAnim()

Or optionally, setup a digital join to trigger the animation.
When join goes high, animation starts. When join goes low, animation stops.

When defining the base file name for each animation object, simply place
### (for as many numbers as you need) in the string.
eg. myIcon###.png would work for icons ranging between myIcon001.png and
myIcon999.png (or any numbers in between).

The first icon in an animation must start at a filename with 1 as the
frame number (NOT zero).

=========================================================================
*/

// ======================================================================
// Global Object
// ======================================================================

var AnimIcon = function(params) {
	var self = {
		fileName:		"",							// REQUIRED
		totalFrames:	0,							// REQUIRED
		fps:			5,							// REQUIRED
		join:			0,							// REQUIRED
		digitalJoin:	0,							// OPTIONAL
		direction:		1,							// OPTIONAL
		loop:			true,						// OPTIONAL
		bounce:			false,						// OPTIONAL
		currentFrame:	1,
		regex:			/([^#]*)(#+)([^#]+)/i,
		interval:		null
	};

	// direction = 1 for increment, -1 for decrement (default 1)
	// loop = boolean, true or false, for if you want the animation to continue looping until forced to stop (default true)
	// bounce = boolean, true or false, for if you want a looping animation to reverse at each end instead of loop back to start (default false);
	self.startAnim = function(direction, loop, bounce) {
		if (direction === undefined) {
			direction = 1;
		}
		if (loop === undefined) {
			loop = true;
		}
		if (bounce === undefined) {
			bounce = false;
		}
		// Remember the direction no matter how this animation object is triggered (loop and bounce are not remembered across anims)
		self.direction = direction;

		// Stop any existing animation going on
		self.stopAnim(true);

		// Start the animation
		self.interval = setInterval(function() {
			// Set the serial join to the new frame filename
			CF.setJoin("s"+self.join, self.generateFileName());
			// Increment and wrap around the frame number
			if (self.direction > 0) {
				if (self.currentFrame+1 > self.totalFrames && loop) {
					// Reached the end of a looping animation
					if (bounce) {
						// Reverse the direction
						self.direction = self.direction*-1;
					}
					self.currentFrame = 1;
				} else {
					self.currentFrame++;
				}
			} else {
				if (self.currentFrame-1 < 1 && loop) {
					// Reached the end of a looping animation
					if (bounce) {
						// Reverse the direction
						self.direction = self.direction*-1;
					}
					self.currentFrame = self.totalFrames;
				} else {
					self.currentFrame--;
				}
			}

			// Stop the animation if we get back to 1 and not looping
			if (((self.direction > 0 && self.currentFrame == self.totalFrames+1) || (self.direction < 0 && self.currentFrame == 0)) && !loop) {
				if (self.currentFrame > self.totalFrames) {
					self.currentFrame = self.totalFrames - 1;
				}
				if (self.currentFrame < 1) {
					self.currentFrame = 1;
				}
				clearInterval(self.interval);
				// Set the digital join of this animation low because it has finished animating
				if (self.digitalJoin > 0) {
					CF.getJoin("d"+self.digitalJoin, function(j,v) {
						if (v == 1) {
							CF.setJoin("d"+self.digitalJoin, 0);
						}
					});
				}
			}
		}, 1000/self.fps);
	};

	self.stopAnim = function(clearJoin) {
		// Stop any existing animation going on
		if (self.interval !== null) {
			clearInterval(self.interval);
		}
		// Set the digital join of this animation low because it has finished animating
		if (self.digitalJoin > 0 && clearJoin != true) {
			CF.getJoin("d"+self.digitalJoin, function(j,v) {
				if (v == 1) {
					CF.setJoin("d"+self.digitalJoin, 0);
				}
			});
		}
	};

	self.generateFileName = function() {
		var frameName = "";
		var matches = self.regex.exec(self.fileName);
		// 0 = baseFileName
		// 1 = prefix
		// 2 = #'s
		// 3 = suffix
		frameName = matches[1]+("00000"+self.currentFrame).slice(matches[2].length*-1)+matches[3];
		if (CF.debug) {
			CF.log("Animation filename: " + frameName);
		}
		
		return frameName;
	};

	self.digitalJoinTrigger = function(j,v,t) {
		if (v == 1) {
			self.startAnim(self.direction, self.loop, self.bounce);
		} else {
			self.stopAnim();
		}
	};

	self.join = params.serialJoin;
	self.fileName = params.baseFileName;
	self.fps = params.framesPerSecond;
	self.totalFrames = params.totalFrames;
	self.direction = params.direction;
	self.loop = params.loop;
	self.bounce = params.bounce;

	if (params.digitalJoin !== undefined) {
		self.digitalJoin = params.digitalJoin;
		CF.watch(CF.JoinChangeEvent, "d"+params.digitalJoin, self.digitalJoinTrigger);
	}

	return self;
}

// Trigger animations via digital join triggering (buttons in simulation mode, etc) or direct JS calls (button actions, gestures, commands, etc)
var Anim1 = new AnimIcon({baseFileName: "downlight-##.png", framesPerSecond: 10, totalFrames: 12, serialJoin: 1, digitalJoin: 1, direction: 1, loop: true, bounce: true});
// Trigger animations via only direct JS calls (button actions, gestures, commands, etc)
var Anim2 = new AnimIcon({baseFileName: "downlight-##.png", framesPerSecond: 10, totalFrames: 12, serialJoin: 1});