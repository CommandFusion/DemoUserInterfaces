// ======================================================================
// Dynalite Object
// ======================================================================

var Dynalite = {
	// ======================================================================
	// Constant vars
	// ======================================================================

	BEGIN_LOGICAL:				0x1C,
	DEFAULT_JOIN:				0xFF,
	CHANNEL_ON:					0x01,
	CHANNEL_OFF:				0xFF,

	setup: function () {
		// Check that the "Dynalite" system is defined in the GUI. Otherwise no commands from JS will work!
		if (CF.systems["Dynalite"] === undefined) {
			// Show alert
			Dynalite.log("Your GUI file is missing the 'Dynalite' system.\nPlease add it to your project before continuing.\n\nSee readme in comments at top of the dynalite.js script.");
			// Stop any further setup
			return;
		}
		// Watch the feedback item in system manager that is handling all incoming data
		CF.watch(CF.FeedbackMatchedEvent, "Dynalite", "Dynalite Incoming Data", Dynalite.onIncomingData);

		Dynalite.log("Dynalite Setup Complete.");
	},
	// Calculate the 2's Compliment checksum for dynalite messages
	appendChecksum: function (data) {
		var checksum = 0; // local var to store the checksum calculation
		var len = data.length; // Calculate length only once by doing it outside of the for loop definition
		for (var i = 0; i < len; i++) {
	        checksum += data.charCodeAt(i); // Get the decimal value of each character and add to checksum
		}
		// Final calculation based on 2's compliment math
		checksum = (256 - (checksum & 0xff));
		Dynalite.log("Checksum: " + checksum.toString(16));
		// Append checksum to original data and return it
		Dynalite.log("Data: " + data + String.fromCharCode(checksum));
		return data + String.fromCharCode(checksum);
	},

	// ======================================================================
	// Incoming Data Point
	// ======================================================================
	onIncomingData: function (itemName, matchedString) {
		// Ensure we are getting the correct data length response from Dynalite
		if (matchedString.length != 8) {
			// Invalid data
			return;
		}
		// Look for dynet opcode to tell us what data is coming back
		switch (matchedString.charCodeAt(3)) {
			case 0x60: // Channel level
				var area = parseInt(matchedString.charCodeAt(1));
				var channel = parseInt(matchedString.charCodeAt(2))+1;
				var targetLevel = parseInt(matchedString.charCodeAt(4));
				var level = parseInt(matchedString.charCodeAt(5));
				// pad join with leading zeros
				// 1001 = area 1, channel 1
				// 1255 = area 1, channel 255.
				var targetJoin = area+("00"+channel).slice(-3);
				if (targetLevel == 255) {
					// OFF
					CF.setJoin("a"+targetJoin, 0);
					CF.setJoin("d"+targetJoin, 0);
				} else {
					CF.log((65535/255)*(256-targetLevel));
					CF.setJoin("a"+targetJoin, (65535/255)*(256-targetLevel));
					CF.setJoin("d"+targetJoin, 1);
				}
		}
	},

	// ======================================================================
	// Action Functions
	// ======================================================================

		/*
		Ramp time opcodes (byte 3)
		\x71 = 100ms resolution, 100ms to 25.5s range
		\x72 = 1sec resolution, 1sec to 3m15s range
		\x73 = 1min resoltuion, 1min to 22min range
		*/

	// Dynamic area/channel from join number
	channelOnJoin: function (join, rampTime) {
		join = join.substr(1);
		var area = Math.floor(join/1000);
		var channel = join%1000;
		Dynalite.channelOn(area, channel, rampTime);
	},
	channelOffJoin: function (join, rampTime) {
		join = join.substr(1);
		var area = Math.floor(join/1000);
		var channel = join%1000;
		Dynalite.channelOff(area, channel, rampTime);
	},
	channelToggleJoin: function (join, rampTime) {
		join = join.substr(1);
		var area = Math.floor(join/1000);
		var channel = join%1000;
		CF.getJoin("d"+join, function(j,v) {
			if (v == "1") {
				Dynalite.channelOff(area, channel, rampTime);
			} else {
				Dynalite.channelOn(area, channel, rampTime);
			}
		});
	},
	channelSetLevelJoin: function (data, rampTime) {
		data = data.split("|");
		join = data[0].substr(1);
		var area = Math.floor(join/1000);
		var channel = join%1000;
		Dynalite.channelSetLevel(area, channel, data[1], rampTime);
	},
	// Turn on a channel
	channelOn: function (area, channel, rampTime) {
		Dynalite.buildMsg(area,(channel-1),0x71,Dynalite.CHANNEL_ON,rampTime);
		// Tell Dynalite to reply with its level after set
		Dynalite.buildMsg(area,(channel-1),0x61,0x00,0x00);
	},
	// Turn off a channel
	channelOff: function (area, channel, rampTime) {
		Dynalite.buildMsg(area,(channel-1),0x71,Dynalite.CHANNEL_OFF,rampTime);
		// Tell Dynalite to reply with its level after set
		Dynalite.buildMsg(area,(channel-1),0x61,0x00,0x00);
	},
	// Ramp to a specific level
	channelSetLevel: function (area, channel, level, rampTime) {
		Dynalite.buildMsg(area,(channel-1),0x71,(level==0?255:256-level),rampTime);
		// Tell Dynalite to reply with its level after set
		Dynalite.buildMsg(area,(channel-1),0x61,0x00,0x00);
	},
	// Call a preset for a specific area
	// Fade Time is in seconds
	areaPreset: function (area, preset, rampTime) {
		if (rampTime === undefined) {
			ramptTime = 10; // Default to 1 second ramp time for presets
		}
		// Calculate fade time bytes, 0.02s resolution (from 1 second resolution in function header)
		var fade = parseInt(rampTime*50)
		Dynalite.buildMsg(area, preset-1, 0x65, fade % 255, Math.floor(fade/255));
	},
	// Get level of specific channels in object literal format:
	// [{area: 1, channels: [1,2,3]}, {area: 2, channels: [4,5,6]}]
	getChannelLevels: function (data) {
		Dynalite.log("get levels"+data);
		try {
			// Loop through each area
			for (var i = 0; i<data.length; i++) {
				// Loop through each channel
				for (var j = 0; i<data[i].channels.length; i++) {
					// request the level for the channel
					Dynalite.buildMsg(data[i].area, data[i].channels[j]-1, 0x61, 0x00, 0x00);
				}
			}
		}
		catch (err) {
			Dynalite.log("ERROR: getChannelLevel(), " + err.description);
		}
	},

	// Build the message format for DyNet protocol, including checksum calc
	buildMsg: function () {
		var a = [];
		if (arguments.length < 6) {
			// Assume logical message
			a.push(Dynalite.BEGIN_LOGICAL);
		}
		for (var i=0; i < arguments.length; i++) {
			a.push(arguments[i]);
		}
		if (arguments.length < 7) {
			// Assume default join
			a.push(Dynalite.DEFAULT_JOIN);
		}

		CF.send("Dynalite", Dynalite.appendChecksum(String.fromCharCode.apply(null, a))); // Append checksum for all outgoing data
	},
	// Only allow logging calls when CF is in debug mode - better performance in release mode this way
	log: function(msg) {
		if (CF.debug) {
			CF.log(msg);
		}
	}
}

CF.modules.push({name:"Dynalite", setup:Dynalite.setup});