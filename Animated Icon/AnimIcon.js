/*  Muliple frame and Single frame, rotation based animation module for CommandFusion
===============================================================================

AUTHORS:	Jarrod Bell, Florent Pillet - CommandFusion
CONTACT:	support@commandfusion.com
URL:		https://github.com/CommandFusion/DemoUserInterfaces
VERSION:	v2.1
LAST MOD:	22-Feb-2012

=========================================================================
HELP:

Create as many animated icons in your project as you require.
Simply add them at the bottom of this script with a unique variable name
eg. Anim1, Anim2, Anim3, etc.

Then on your buttons (or gestures, commands, etc) call the desired
animation's startAnim and stopAnim functions.

Or optionally, setup a digital join to trigger the animation.
When join goes high, animation starts. When join goes low, animation stops.

When defining the base file name for each multi-frame animation object, simply place
### (for as many numbers as you need) in the string.
eg. myIcon###.png would work for icons ranging between myIcon001.png and
myIcon999.png (or any numbers in between).

The first icon in an animation must start at a filename with 1 as the
frame number (NOT zero).

The filename for single-frame animations doesn't matter.

=========================================================================
*/

/* Multipe Frame-based animation
 *
 * See example at bottom of script on how to use it
 *
 */
var AnimIcon = function(params) {
	var self = {
		fileName:		"",							// REQUIRED
		totalFrames:	0,							// REQUIRED
		fps:			5,							// REQUIRED
		join:			0,							// REQUIRED
		triggerJoin:	0,							// OPTIONAL
		direction:		1,							// OPTIONAL
		loop:			true,						// OPTIONAL
		bounce:			false,						// OPTIONAL
		currentFrame:	1,
		regex:			/([^#]*)(#+)([^#]+)/i,
		interval:		null
	};

	// direction = 1 for increment, -1 for decrement (default 1)
	// loop = boolean, true or false, for if you want the animation to continue looping until forced to stop (default to true)
	// bounce = boolean, true or false, for if you want a looping animation to reverse at each end instead of loop back to start (default false);
	self.start = function(direction, loop, bounce) {
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
		self.stop(true);

		// Start the animation
		self.interval = setInterval(function() {
			// Set the serial join to the new frame filename
			CF.setJoin("s"+self.join, self.generateFileName());
			var dir = self.direction;
			var total = self.totalFrames;
			var frame = self.currentFrame;

			// Increment and wrap around the frame number
			if (dir > 0) {
				if (frame+1 > total && loop) {
					// Reached the end of a looping animation
					if (bounce) {
						// Reverse the direction
						dir = -dir;
						frame = total - 1;
					} else {
						frame = 1;
					}
				} else {
					frame++;
				}
			} else if (frame < 2 && loop) {
				// Reached the end of a looping animation
				if (bounce) {
					// Reverse the direction
					dir = -dir;
					frame = 2;
				} else {
					frame = total;
				}
			} else {
				frame--;
			}

			// Stop the animation if we get back to 1 and not looping
			if (!loop && ((dir > 0 && frame === total+1) || (dir < 0 && frame === 0))) {
				frame = Math.max(1, Math.min(frame, total));
				clearInterval(self.interval);
				// Set the digital join of this animation low because it has finished animating
				if (self.triggerJoin > 0) {
					CF.getJoin("d"+self.triggerJoin, function(j,v) {
						if (v == 1) {
							CF.setJoin("d"+self.triggerJoin, 0);
						}
					});
				}
			}

			self.currentFrame = frame;
			self.direction = dir;
		}, 1000/self.fps);
	};

	self.stop = function(clearJoin) {
		// Stop any existing animation going on
		if (self.interval !== null) {
			clearInterval(self.interval);
		}
		// Set the digital join of this animation low because it has finished animating
		if (clearJoin === true && self.triggerJoin > 0) {
			CF.getJoin("d"+self.triggerJoin, function(j,v) {
				if (v == 1) {
					CF.setJoin("d"+self.triggerJoin, 0);
				}
			});
		}
	};

	self.generateFileName = function() {
		var matches = self.regex.exec(self.fileName);
		// 0 = baseFileName
		// 1 = prefix
		// 2 = #'s
		// 3 = suffix
		var frameName = matches[1]+("00000"+self.currentFrame).slice(matches[2].length*-1)+matches[3];
		if (CF.debug) {
			CF.log("Animation filename: " + frameName);
		}
		return frameName;
	};

	self.triggerJoinChanged = function(j,v) {
		if (v == 1) {
			self.start(self.direction, self.loop, self.bounce);
		} else {
			self.stop(false);
		}
	};

	self.join = params.serialJoin;
	self.fileName = params.baseFileName;
	self.fps = params.framesPerSecond;
	self.totalFrames = params.totalFrames;
	self.direction = params.direction;
	self.loop = params.loop;
	self.bounce = params.bounce;

	if (typeof(params.triggerJoin) === "number") {
		self.triggerJoin = params.triggerJoin;
		CF.watch(CF.JoinChangeEvent, "d"+params.triggerJoin, self.triggerJoinChanged);
	}

	return self;
};

/**
 * Animation that rotates an object clockwise or counter-clockwise. Params should be an
 * object with a number of properties that describe the animation to run
 * See below for REQUIRED and OPTIONAL parameters:
 * "duration" (number) OPTIONAL, the duration of a full 360° rotation, in seconds. Defaults to 1 second
 * "join" (string or number) REQUIRED the join of the object to rotate. Can be a string representing a full join (i.e. "s1") or a number that will be converted to a serial object join (i.e 1 for join "s1"). Image objects are on serial joins, but other object types can be rotated too, like buttons (using their digital join)
 * "trigger" (string or number) OPTIONAL
 * @param params    the animation parameters
 */
var SpinningAnimation = function(params) {
	var self = {
		duration:	    params.duration || 1,	    // OPTIONAL (seconds, defaults to 1 second for full rotation)
		join:			makeJoinString("s", params.join),
		triggerJoin:	makeJoinString("d", params.triggerJoin),
		direction:		params.direction || 1,		// OPTIONAL (1 = clockwise, -1 = anticlockwise)
		loop:           (params.loop === true),     // OPTIONAL (true=loop animation, defaults to false)
		bounce:         (params.bounce === true),   // OPTIONAL (true=bounce animation, defaults to false)
		nextAngle:		0,
		running: 		false
	};

	/**
	 * Start a rotation animation. It is possible to modify the animation parameters that
	 * were set at construction time by passing direction, loop and bounce. All are optional.
	 * @param direction     OPTIONAL, 1 for clockwise rotation, -1 for counter-clockwise rotation
	 * @param loop          OPTIONAL, true if the animation should loop over and over, false for one-shot. Defaults to false
	 * @param bounce        OPTIONAL, true if the animation should bounce (reverse) when full rotation has been achieved. Defaults to false.
	 */
	self.start = function (direction, loop, bounce) {
		if (self.running) {
			self.stop(false);
		}
		if (self.join == null) {
			throw "invalid join to animate";
		}
		self.running = true;
		if (self.triggerJoin != null) {
			CF.setJoin(self.triggerJoin, 1);
		}
		if (typeof(direction) === "number") {
			self.direction = (direction === 1) ? 1 : -1;
		}
		if (typeof(loop) === "boolean") {
			self.loop = loop;
		}
		if (typeof(bounce) === "boolean") {
			self.bounce = bounce;
		}
		CF.setProperties({join:self.join, zrotation:0});
		self.nextDirection = self.direction;
		self.nextAngle = 179 * self.direction;
		playNextAnimation();
	};

	/**
	 * Stop an ongoing rotation animation. Can optionally clear the digital join used
	 * to start/stop the animation
	 * @param resetTrigger     true to update the animation control digital join. Defaults to false.
	 */
	self.stop = function(resetTrigger) {
		if (self.running) {
			self.running = false;
			if (self.triggerJoin != null && arguments.length > 0 && resetTrigger) {
				CF.setJoin(self.triggerJoin, 0);
			}
		}
	};

	/**
	 * Internal helper to generate a join string. This function ensures that no
	 * object on join 0 can be used, and accepts numbers (in this case, generates
	 * a join using type + number) and strings (doesn't modify the given string)
	 * @param type	a type string "s", "d" or "a" for example
	 * @param join	a string or number
	 */
	function makeJoinString(type, join) {
		var t = typeof(join);
		if (t === "number") {
			return type + join;
		}
		if (t === "string") {
			if (join.length > 0 && join.charAt(0) == type.charAt(0))
				return join;
		}
		return null;
	}

	function playNextAnimation() {
		CF.setProperties(   {join: self.join, zrotation: self.nextAngle},
							0,
							self.duration / 2,
							CF.AnimationCurveLinear,
							function() {
								if (self.running) {
									if (!self.loop && Math.abs(self.nextAngle) >= 358) {
										self.stop(true);
									} else {
										if (self.bounce && (self.nextAngle >= 358 || self.nextAngle <= 2)) {
											self.nextDirection = -self.nextDirection;
										}
										self.nextAngle += 179 * self.nextDirection;
										playNextAnimation();
									}
								}
							});
	}

	/**
	 * Private function which starts or stop the animation when the defined trigger join
	 * changes. If the trigger join is defined, we watch it and this function is the
	 * watch callback.
	 */
	function triggerJoinChanged(j,v) {
		if (v == 1) {
			if (!self.running) {
				self.start();
			}
		} else if (self.running) {
			self.stop(false);
		}
	}

	if (typeof(self.triggerJoin) === "number") {
		CF.watch(CF.JoinChangeEvent, self.triggerJoin, triggerJoinChanged);
	}

	return self;
};


// Trigger animations via digital join triggering (buttons in simulation mode, etc) or direct JS calls (button actions, gestures, commands, etc)
var Anim1 = new AnimIcon({baseFileName: "downlight-##.png", framesPerSecond: 10, totalFrames: 12, serialJoin: 1, triggerJoin: 1, direction: 1, loop: true, bounce: true});
// Trigger animations via only direct JS calls (button actions, gestures, commands, etc)
var Anim2 = new AnimIcon({baseFileName: "downlight-##.png", framesPerSecond: 10, totalFrames: 12, serialJoin: 1});
// Single frame, rotation-based example:
var Rotation1 = new SpinningAnimation({duration: 1, join: 3, direction: 1, loop: true, bounce: false});

// Only one userMain function per project!
CF.userMain = function () {
	// Start the loading spinner animation on startup (could also attach to a command triggered by a page timer for same effect)
	Rotation1.start();
};