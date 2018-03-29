var RGBController = function(params) {
	params = params || {};

	var self = {
		prefix: 0xFE,
		address: params.address || 0x4C,
		systemName: params.systemName || "RGBController",
		CFLink: params.CFLink || {
			id: "",
			command: "",
			module: ""
		},
		k : new KeySpline(0.96,0.2,0.9,0.69), // This is used to change the curve of light intensity - LEDs intensity change is much more noticable at bottom end of the scale
		// Use the live demo tool on this page to change the curve values for the above KeySpline function: http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
		callback: null, // function to be called when setRGB is called
		lastValues: [0,0,0],
		rFader: null,
		gFader: null,
		bFader: null
	};

	self.setAddress = function(newAddress) {
		self.sendData(0x41, newAddress);
	};

	self.setChannelLevel = function(channel, level, doScale) {
		if ([1,2,3].indexOf(channel) == -1) {
			CF.log("setChannelLevel: channel must be 1, 2 or 3. '" + channel + "' is not a valid channel.");
			return;
		}
		//CF.log("setChannelLevel: " + channel + " = " + level);
		var newLevel;
		if (doScale) {
			var time = (1/250) * (level/1.02);
			newLevel = parseInt(250 * self.k.get(time));
		} else {
			newLevel = parseInt(level/1.02);
		}

		if (newLevel < 0) {
			newLevel = 0;
		} else if (newLevel > 250) {
			newLevel = 250;
		}
		self.lastValues[channel-1] = newLevel;
		self.sendData(0x42, channel, newLevel);

		// if (self.callback) {
		// 	self.callback(channel, newLevel);
		// }
	};

	self.setAllLevels = function(level, doScale, doSaveValues) {
		if (level < 0) {
			level = 0;
		} else if (level > 250) {
			level = 250;
		}
		if (doSaveValues) {
			self.lastValues[0] = level;
			self.lastValues[1] = level;
			self.lastValues[2] = level;
		}

		self.sendData(0x52, parseInt(level/1.02), doScale);	
	};

	self.setRGBLevels = function(r, g, b, doFade) {
		// Fade to the chosen level
		if (self.rFader) {
			self.rFader.stopFade();
		}
		if (self.gFader) {
			self.gFader.stopFade();
		}
		if (self.bFader) {
			self.bFader.stopFade();
		}
		if (!doFade) {
			// Send the three channel levels separately, with 75ms delay between each message
			self.setChannelLevel(1, r);
			setTimeout(function() { self.setChannelLevel(2, g); }, 50);
			setTimeout(function() { self.setChannelLevel(3, b); }, 50);
		} else {
			self.rFader = new Fader(self, self.lastValues[0], r, 500, 10);
			self.gFader = new Fader(self, self.lastValues[1], g, 500, 10);
			self.bFader = new Fader(self, self.lastValues[2], b, 500, 10);

			self.rFader.startFade("r");
			self.gFader.startFade("g");
			self.bFader.startFade("b");
		}
	};

	self.startSequence = function(seqNumber) {
		if ([1,2,3,4,5,6,7].indexOf(seqNumber) == -1) {
			CF.log("startSequence: sequence number must be between 1 and 7. '" + seqNumber + "' is not a valid sequence number.");
			return;
		}
		self.sendData(0x43, seqNumber);
	};

	self.stopSequence = function() {
		self.sendData(0x43, 0);
	};

	self.setSequenceTime = function(seqNumber) {
		self.sendData(0x43, seqNumber);
	};

	self.sendData = function() {
		var output;
		// Create an array from the arguments object
		var args = Array.prototype.slice.call(arguments);
		// prepend the prefix and address bytes
		args.unshift(self.prefix, self.address);

		if (self.CFLink.id) {
			args.unshift(0xF2, self.CFLink.id, 0xF3);
			output = "\xF2" + String.fromCharCode(self.CFLink.id) + "\xF3" + self.CFLink.command + "\xF4" + (self.CFLink.module == "" ? "" : (self.CFLink.module.indexOf("M") != 0 ? "M" + self.CFLink.module : self.CFLink.module) + "|") + (self.CFLink.port == "" ? "" : "P" + ("0"+self.CFLink.port).slice(-2) + ":") + String.fromCharCode.apply(null, args) + "\xF5\xF5";
		} else {
			output = String.fromCharCode.apply(null, args);
		}
		// send command as a string generated from each integer passed to this function
		CF.send(self.systemName, output);
	}

	return self;
};

CF.modules.push({
	name: "RGBController",	// the name of the module (mostly for display purposes)
	object: RGBController,	// the object to which the setup function belongs ("this")
	version: 1.0	// An optional module version number that is displayed in the Remote Debugger
});

/**
* KeySpline - use bezier curve for transition easing function
* is inspired from Firefox's nsSMILKeySpline.cpp
* Usage:
* var spline = new KeySpline(0.25, 0.1, 0.25, 1.0)
* spline.get(x) => returns the easing value | x must be in [0, 1] range
*/
function KeySpline (mX1, mY1, mX2, mY2) {

  this.get = function(aX) {
    if (mX1 == mY1 && mX2 == mY2) return aX; // linear
    return CalcBezier(GetTForX(aX), mY1, mY2);
  }

  function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
  function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
  function C(aA1)      { return 3.0 * aA1; }

  // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
  function CalcBezier(aT, aA1, aA2) {
    return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
  }

  // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
  function GetSlope(aT, aA1, aA2) {
    return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
  }

  function GetTForX(aX) {
    // Newton raphson iteration
    var aGuessT = aX;
    for (var i = 0; i < 4; ++i) {
      var currentSlope = GetSlope(aGuessT, mX1, mX2);
      if (currentSlope == 0.0) return aGuessT;
      var currentX = CalcBezier(aGuessT, mX1, mX2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }
}

var Fader = function(rgbController, from, to, time, steps, ks) {
	var self = {
		controller: rgbController,
		currentStep: 0,
		from: from || 0,
		to: to || 0,
		time: time || 1000,
		steps: steps || 10,
		ksFade: ks || new KeySpline(0.74,0.1,0.97,0.44),
		range: 0,
		channel: "rgb",
		fadeInteval: null
	};

	self.startFade = function (channel, from, to, time, steps) {
		self.channel = channel.toLowerCase();
		self.steps = steps || self.steps;
		self.time = time || self.time;
		self.to = (to === undefined) ? self.to : to;
		self.from = (from === undefined) ? self.from : from;
		self.range = (self.from < self.to) ? self.to-self.from : self.from-self.to;
		self.currentStep = 0;
		// Clear any existing interval
		clearInterval(self.fadeInteval);
		self.fadeInteval = setInterval(function() { self.fade() }, self.time/self.steps);
	};

	self.fade = function () {
		var level;
		if (self.from < self.to) {
			level = Math.round(self.from + (self.range * self.ksFade.get(self.currentStep)));
		} else {
			level = Math.round(self.from - (self.range * self.ksFade.get(self.currentStep)));
		}
		CF.log(self.from + ", " + self.to + ", " + self.range);
		self.currentStep = self.currentStep + (1/self.steps);
		if (self.channel.indexOf("r") !== -1) {
			self.controller.setChannelLevel(1, level);
		}
		if (self.channel.indexOf("g") !== -1) {
			self.controller.setChannelLevel(2, level);
		}
		if (self.channel.indexOf("b") !== -1) {
			self.controller.setChannelLevel(3, level);
		}
		if (self.currentStep >= 1) {
			// Finished the fade
			self.stopFade();
		}
	};

	self.stopFade = function () {
		clearInterval(self.fadeInteval);
	};

	return self;
}