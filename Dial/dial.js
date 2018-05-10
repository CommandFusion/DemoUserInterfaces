/* Dial / Knob module
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

 AUTHORS:	Jarrod Bell, CommandFusion
 CONTACT:	support@commandfusion.com
 VERSION:	v 1.1

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

 USAGE:

 Custom parameters:
 ------------------
 var newDial = new Dial("s1", callbackFunction, {srcJoin: "s2", maxTime: 0.5, minTime: 0.3, angleOffset: -45, maxAngle: 260});

 Default parameters - just need to supply join number for the object to rotate and the callback function to be notified
 when the dial rotates:
 ----------------------
 var newDial2 = new Dial("s10", callbackFunction);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
*/

var Dial = function(join, callback, params) {

	var self = {
		// Join string for the object to rotate
		join : (join !== undefined) ? join : "s1",
		// Join string for the object to retrieve touch position/angles from - This allows you to use one image to rotate, another image to touch.
		// If this is not defined, it will default to the same join as the object being rotated
		srcJoin : (params.srcJoin !== undefined) ? params.srcJoin : join || "s1",
		// Maximum time it takes for the dial to rotate from current position to desired position
		MAX_TIME : (params.maxTime !== undefined) ? params.maxTime : 0.5,
		// Minimum time it takes for the dial to rotate from current position to desired position
		MIN_TIME : (params.minTime !== undefined) ? params.minTime : 0.3,
		// Degrees to offset the angle by (used mainly if the source graphic knob indicator mark is not placed at the bottom point of the dial image)
		ANGLE_OFFSET : (params.angleOffset !== undefined) ? params.angleOffset : 0,
		// Maximum angle for the object to be able to reach (useful for dials without full rotation requirements)
		MAX_ANGLE : (params.maxAngle !== undefined) ? params.maxAngle : 360,

		ROTATING : false,
		NEXT_POS : -1,
		callback: callback
	};

	self.setRotation = function(pos, relative, ignoreCallback) {
		// Rotate the object to a new position, absolute or relative.
		// If an animation is in-flight, don't kill it otherwise we may get
		// incorrect animation for large angles. Instead, stage the next
		// position in NEXT_POS, and handle it at the end of the current rotation
		CF.getProperties(self.join, function(j) {
			var fromAngle = j.zrotation;
			if (relative === true) {
				pos = fromAngle + parseInt(pos, 10);
			}
			if (self.ROTATING === true) {
				// rotation is ongoing
				self.NEXT_POS = pos;
				return;
			}
			self.NEXT_POS = -1;
			var toAngle = Math.max(0, Math.min(parseInt(pos, 10), self.MAX_ANGLE));
			var distance = toAngle - j.zrotation;
			var absDistance = Math.abs(distance);
			var duration = (self.MAX_TIME > 0) ? Math.max(self.MIN_TIME, (self.MAX_TIME / self.MAX_ANGLE) * absDistance) : 0;

			//CF.log("from " + fromAngle + " to " + toAngle + ": distance=" + distance + ", rotationTime=" + duration);

			if (absDistance > 179) {
				// rotation will go the shortest route possible
				// so have make sure to set a midpoint if we want to rotate larger than 179 degrees
				// otherwise it will rotate backwards!
				self.ROTATING = true;
				CF.setProperties({join: self.join, zrotation: fromAngle + distance / 2.0}, 0, duration / 2.0, CF.AnimationCurveLinear, function() {
					if (self.NEXT_POS != -1) {
						self.ROTATING = false;
						self.setRotation(self.NEXT_POS);
					} else {
						CF.setProperties({join: self.join, zrotation: toAngle}, 0, duration / 2.0, CF.AnimationCurveLinear, function() {
							self.ROTATING = false;
							if (self.NEXT_POS != -1) {
								self.setRotation(self.NEXT_POS);
							}
						});
					}
				});
			} else {
				// Rotate directly to the given position
				self.ROTATING = true;
				CF.setProperties({join: self.join, zrotation: toAngle}, 0, duration, CF.AnimationCurveLinear, function() {
					self.ROTATING = false;
					if (self.NEXT_POS != -1) {
						self.setRotation(self.NEXT_POS);
					}
				});
			}

			if (self.callback !== undefined && !ignoreCallback) {
				self.callback(toAngle, self.MAX_ANGLE, self.srcJoin);
			}

		});
	};

	self.angleFromPointInObject = function(objW, objH, pX, pY) {
		var dx = pX - objW / 2.0;				// x distance to object center
		var dy = objH / 2.0 - pY;				// y distance to object center (reverse Y to transform to math coordinates)
		var r = Math.sqrt(dx * dx + dy * dy);	// radius of imaginary circle from object center to point on imaginary circle

		// clamp x,y to [-1.0, 1.0] on the unit circle, get angle in radians, convert to degrees
		return Math.atan2(r / dy, r / dx) / (Math.PI / 180.0);
	};

	self.rotateToPoint = function(x, y) {
		CF.getProperties(self.srcJoin, function(j) {
			var newAngle = self.angleFromPointInObject(j.w, j.h, x, y);
			// We need to manipulate the calculated value from the range [-180,180] to [0,360]
			newAngle += 180;
			//correction for "negative" quadrants
			if (newAngle >= 90 && newAngle < 180) {
				newAngle = newAngle + 180;
			} else if (newAngle >= 270) {
				newAngle = newAngle - 180;
			}
			newAngle = newAngle + self.ANGLE_OFFSET;
			self.setRotation(newAngle);
		});
	};

	// Return the created instance object
	return self;
};