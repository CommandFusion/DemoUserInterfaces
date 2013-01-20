/*  Muliple animation frames in a singl image
===============================================================================

AUTHORS:	Jarrod Bell, Florent Pillet - CommandFusion
CONTACT:	support@commandfusion.com
URL:		https://github.com/CommandFusion/DemoUserInterfaces

=========================================================================
HELP:


=========================================================================
*/

/* Multipe Frame-based animation from single image file
 *
 * See example at bottom of script on how to use it
 *
 */
var AnimSprite = function(params) {
	var self = {
		fileName:		"",							// REQUIRED
		totalFrames:	0,							// REQUIRED
		fps:			5,							// REQUIRED
		join:			0,							// REQUIRED
		loop:			true,						// OPTIONAL
		bounce:			false,						// OPTIONAL
		currentFrame:	1,
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
			var dir = self.direction;
			var total = self.totalFrames;
			var frame = self.currentFrame;

			// Move the sprite by the size of each frame
			CF.setProperties({join: "s1", x: (frame-1) * -64 });

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

	self.join = params.serialJoin;
	self.fileName = params.fileName;
	self.fps = params.framesPerSecond;
	self.totalFrames = params.totalFrames;
	self.direction = params.direction;
	self.loop = params.loop;
	self.bounce = params.bounce;

	return self;
};

var Anim1 = new AnimSprite({fileName: "sprite-sunny.png", framesPerSecond: 8, totalFrames: 16, serialJoin: 1});

// Only one userMain function per project!
CF.userMain = function () {
	// Start the animation on startup
	Anim1.start();
};