var ArtNet = {
	systemName : "ArtNetUDP",
	header : [65, 114, 116, 45, 78, 101, 116, 0],
	sequence : 0,
	physical : 0,
	universe : 0,
	numChannels : 512,
	dmxData : [],
	preambleSize : 18,
	opCode : 0x5000, // Default OpCode for sending DMX data
	flooding : false, // Whether or not the DMX data is being sent out in constant flood of traffic
	floodingInterval : null,
	rampingDisabled: false,

	setup : function () {
		for (var i = 0; i < this.numChannels; i++) {
			this.dmxData[i] = 0;
		}

		this.startFlooding(10);
	},

	allOff : function () {
		for (var i = 0; i < this.numChannels; i++) {
			this.dmxData[i] = 0;
		}

		if (!this.flooding) {
			this.sendDMX();
		}
	},

	// @channel integer Channel number from 0 to 'numChannels' (default 511)
	// returns integer Channel level from 0 (off) to 255 (on)
	getChannelLevel : function (channel) {
		return this.dmxData[channel];
	},

	// @channel integer Channel number from 0 to 'numChannels' (default 511)
	// @level integer Channel level from 0 (off) to 255 (on)
	setChannelLevel : function (channel, level) {
		this.dmxData[channel] = level;
		if (!this.flooding) {
			this.sendDMX();
		}
	},

	setRGB : function (channel, r, g, b) {
		this.dmxData[channel * 3] = r;
		this.dmxData[channel * 3 + 1] = g;
		this.dmxData[channel * 3 + 2] = b;
		if (!this.flooding) {
			this.sendDMX();
		}
	},

	// @rampTo integer Level to ramp to
	// @time integer Milliseconds that a ramp from 0-255 would take - maximum time to complete a ramp.
	rampAll : function (rampTo, time) {
		rampTo = Math.min(Math.max(rampTo, 0), 255); // Clamp to range 0-255

		var stillRamping = false;
		for (var i = 0; i < this.numChannels; i++) {
			if (this.dmxData[i] > rampTo) {
				this.dmxData[i] -= 1;
				stillRamping = true;
			} else if (this.dmxData[i] < rampTo) {
				this.dmxData[i] += 1;
				stillRamping = true;
			}
		}

		if (!this.flooding) {
			this.sendDMX();
		}

		if (stillRamping && !this.rampingDisabled) {
			var that = this;
			setTimeout(function(that) { that.rampAll(rampTo, time); }, time/255, that);
		}
	},

	// @rampTo integer Level to ramp to
	// @time integer Milliseconds that a ramp from 0-255 would take - maximum time to complete a ramp.
	rampChannel : function (channel, rampTo, time) {
		rampTo = Math.min(Math.max(rampTo, 0), 255); // Clamp to range 0-255

		var stillRamping = false;
		if (this.dmxData[channel] > rampTo) {
			this.dmxData[channel] -= 1;
			stillRamping = true;
		} else if (this.dmxData[channel] < rampTo) {
			this.dmxData[channel] += 1;
			stillRamping = true;
		}

		if (!this.flooding) {
			this.sendDMX();
		}

		if (stillRamping && !this.rampingDisabled) {
			var that = this;
			setTimeout(function(that) { that.rampChannel(channel, rampTo, time); }, time/255, that);
		}
	},

	rampRGBChannel : function (channel, rampTo, time) {
		this.rampChannel(channel * 3, rampTo, time);
		this.rampChannel(channel * 3 + 1, rampTo, time);
		this.rampChannel(channel * 3 + 2, rampTo, time);
	},

	stopAllRamping : function () {
		this.rampingDisabled = true;
		setTimeout(function(that){that.rampingDisabled = false;}, 1000, this);
	},

	startFlooding : function (time) {
		this.flooding = true;
		clearInterval(this.floodingInterval);
		this.floodingInterval = setInterval(function(self) { self.sendDMX(); }, time || 100, this);
	},

	stopFlooding : function () {
		this.flooding = false;
		clearInterval(this.floodingInterval);
	},

	sendDMX : function () {
		this.opCode = 0x5000;

		var msg = [];

		var i = 0;
		for (; i < this.header.length; i++) {
			msg[i] = this.header[i];
		}

		msg[8] = this.opCode & 0xFF;
		msg[9] = this.opCode >> 8;

		msg[10] = 0; // Flags
		msg[11] = 14; // Version

		msg[12] = this.sequence;
		msg[13] = this.physical;

		msg[14] = this.universe & 0xFF;
		msg[15] = this.universe >> 8;

		msg[16] = this.numChannels >> 8;
		msg[17] = this.numChannels & 0xFF;

		for (i = 0; i < this.numChannels; i++) {
			msg[i + this.preambleSize] = this.dmxData[i] || 0;
		}

		var msgString = String.fromCharCode.apply(null, msg);
		//CF.log(msgString);
		CF.send(this.systemName, msgString);
	}
};

CF.modules.push({
	name: "Art-Net",		// the name of the module (mostly for display purposes)
	setup: ArtNet.setup,	// the setup function to call
	object: ArtNet,			// the object to which the setup function belongs ("this")
	version: 1.0			// An optional module version number that is displayed in the Remote Debugger
});