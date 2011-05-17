// ======================================================================
// Denon Object
// ======================================================================

//	CF.watch(CF.FeedbackMatchedEvent, "Denon", "Incoming Data", Denon.onIncomingData);
//	CF.watch(CF.ConnectionStatusChange, "Denon", Denon.onConnectionChange, true);

var Denon = {

	// ======================================================================
	// Global vars
	// ======================================================================

	enabled:				0,
	powerState:				0,
	volLevel:				0,
	chanLevel:				{fl:0,fr:0,c:0,sw:0,sl:0,sr:0,sbl:0,sbr:0,sb:0,fhl:0,fhr:0,fwl:0,fwr:0},
	zone1Mute:				0,
	zone2Mute:				0,
	zone3Mute:				0,
	inputSource:			null,
	zone1:					0,
	zone2:					0,
	zone3:					0,
	recordSource:			null,
	inputAuto:				"AUTO",
	videoSource:			null,
	tunerFreq:				0,
	tunerBand:				"FM",
	tunerPreset:			null,
	tunerMode:				"AUTO",

	setup: function () {
		// Check that the "Denon" system is defined in the GUI. Otherwise no commands from JS will work!
		if (CF.systems["Denon"] === undefined) {
			// Show alert
			CF.log("Your GUI file is missing the 'Denon' system.\nPlease add it to your project before continuing.\n\nSee readme in comments at top of the denon.js script.");
			// Stop any further setup
			return;
		}

		// Watch all incoming data through a single feedback item
		CF.watch(CF.FeedbackMatchedEvent, "Denon", "Denon Incoming Data", Denon.onIncomingData);


		CF.watch(CF.ConnectionStatusChangeEvent, "Denon", Denon.onConnectionChange, true);
	},
	// ======================================================================
	//  Handle Connections/Disconnections
	// ======================================================================
	onConnectionChange: function (system, connected, remote) {
		if (connected) {
			// Connected to denon, enable comms.
			Denon.enabled = 1;
		}
	},
	// ======================================================================
	// Incoming Data Point
	// ======================================================================
	onIncomingData: function (itemName, matchedString) {
		var dataTwo = matchedString.slice(2,-1);
		var dataThree = matchedString.slice(3,-1);
		switch (matchedString.substr(0,2)) {
			case "PW":
				// Power
				if (dataTwo == "ON") {
					Denon.powerState = 1;
				} else if (dataTwo == "STANDBY") {
					Denon.powerState = 0;
				}
				break;
			case "MV":
				// Master Volume
				if (dataTwo.length == 2) {
					Denon.volLevel = parseInt(dataTwo);
					CF.setJoin("a88", (65535/100)*parseInt(dataTwo));
					CF.setJoin("s88", dataTwo);
				}
				break;
			case "CV":
				// Channel volume, use regex to grab the approprate data
				var chanRegex = /(.*?)\s(\d*)/
				var matches = chanRegex.exec(dataTwo);
				if (matches != null) {
					switch (matches[1]) {
						case "FL": // Front Left
							Denon.chanLevel.fl = matches[2];
							break;
						case "FR": // Front Right
							Denon.chanLevel.fr = matches[2];
							break;
						case "C": // Center
							Denon.chanLevel.c = matches[2];
							break;
						case "SW": // Subwoofer
							Denon.chanLevel.sw = matches[2];
							break;
						case "SL": // Surround Left
							Denon.chanLevel.sl = matches[2];
							break;
						case "SR": // Surround Right
							Denon.chanLevel.sr = matches[2];
							break;
						case "SBL": // Surround Back Left
							Denon.chanLevel.sbl = matches[2];
							break;
						case "SBR": // Surround Back Right
							Denon.chanLevel.sbr = matches[2];
							break;
						case "SB": // Surround Back
							Denon.chanLevel.sb = matches[2];
							break;
						case "FHL": // Front Height Left
							Denon.chanLevel.fhl = matches[2];
							break;
						case "FHR": // Front Height Right
							Denon.chanLevel.fhr = matches[2];
							break;
						case "FWL": // Front Wide Left
							Denon.chanLevel.fwl = matches[2];
							break;
						case "FWR": // Front Wide Right
							Denon.chanLevel.fwr = matches[2];
							break;
					}
				}
				break;
			case "MU":
				// Master Mute
				if (dataTwo == "ON") {
					Denon.zone1Mute = 1;
				} else if (dataTwo == "OFF") {
					Denon.zone1Mute = 0;
				}
			case "SI":
				// Input Source
				Denon.inputSource = dataTwo;
			case "ZM":
				// Zone Main
				if (dataTwo == "ON") {
					Denon.zone1 = 1;
				} else if (dataTwo == "OFF") {
					Denon.zone1 = 0;
				}
			case "SR":
				// Source Record
				if (dataTwo == "SOURCE") {
					Denon.recordSource = null;
				} else {
					Denon.recordSource = dataTwo;
				}
			case "SD":
				// Input Auto Mote
				Denon.inputAuto = dataTwo;
			case "SV":
				// Video Select
				if (dataTwo == "SOURCE") {
					Denon.videoSource = null;
				} else {
					Denon.videoSource = dataTwo;
				}
			case "TF":
				// Tuner Frequency
				if (dataTwo.substr(0,2) == "AN") {
					Denon.tunerFreq = parseInt(dataTwo.substr(2));
				}
			case "TP":
				// Tuner Preset
				if (dataTwo.substr(0,2) == "AN") {
					Denon.tunerPreset = dataTwo.substr(2);
				}
			case "TM":
				// Tuner Band or Mode
				if (dataTwo.substr(2,2) == "FM") {
					Denon.tunerBand = "FM"
				} else if (dataTwo.substr(2,2) == "AM") {
					Denon.tunerBand = "AM"
				} else {
					// AUTO or MANUAL
					Denon.tunerMode = dataTwo.substr(2);
				}
		}
	},

	// ======================================================================
	// Action Functions
	// ======================================================================

	// Set the mute state of a specific zone.
	// 0 = OFF
	// 1 = ON
	// 2 = TOGGLE
	zoneMute: function(zone, state) {
		if (zone === undefined || zone == 1) {
			// master zone mute
			if (state == 2) {
				// Toggle
				Denon.sendMsg("MU"+(Denon.zone1Mute==1?"OFF":"ON"));
			} else {
				// Set State
				Denon.sendMsg("MU"+(state==1?"ON":"OFF"));
			}
		} else {
			// Zone 2 or 3, choose dynamically from zone parameter
			if (state == 2) {
				// Toggle
				Denon.sendMsg("Z"+zone+"MU"+(Denon["zone"+zone+"Mute"]==1?"OFF":"ON"));
			} else {
				// Set State
				Denon.sendMsg("Z"+zone+"MU"+(state==1?"ON":"OFF"));
			}
		}
	},
	zoneVolUp: function(zone) {
		if (zone === undefined || zone == 1) {
			// master zone mute
			Denon.sendMsg("MVUP");
		} else {
			// Zone 2 or 3, choose dynamically from zone parameter
			Denon.sendMsg("Z"+zone+"UP");
		}
	},
	zoneVolDown: function(zone) {
		if (zone === undefined || zone == 1) {
			// master zone mute
			Denon.sendMsg("MVDOWN");
		} else {
			// Zone 2 or 3, choose dynamically from zone parameter
			Denon.sendMsg("Z"+zone+"DOWN");
		}
	},
	zoneVolLevel: function(zone, level) {
		if (zone === undefined || zone == 1) {
			// master zone mute
			Denon.sendMsg("MV"+level);
		} else {
			// Zone 2 or 3, choose dynamically from zone parameter
			Denon.sendMsg("Z"+level);
		}
	},
	// Set the power state of a specific zone.
	// 0 = OFF
	// 1 = ON
	// 2 = TOGGLE
	zonePower: function(zone, state) {
		if (zone === undefined || zone == 1) {
			// master zone power
			if (state == 2) {
				// Toggle
				Denon.sendMsg("ZM"+(Denon.zone1==1?"OFF":"ON"));
			} else {
				// Set State
				Denon.sendMsg("ZM"+(state==1?"ON":"OFF"));
			}
		} else {
			// Zone 2 or 3, choose dynamically from zone parameter
			if (state == 2) {
				// Toggle
				Denon.sendMsg("Z"+zone+(Denon["zone"+zone]==1?"OFF":"ON"));
			} else {
				// Set State
				Denon.sendMsg("Z"+zone+(state==1?"ON":"OFF"));
			}
		}
	},
	power: function(state) {
		if (state) {
			Denon.sendMsg("PWON");
		} else {
			Denon.sendMsg("PWSTANDBY");
		}
	},
	// Select a tuner preset.
	// Alternatively, pass a value of "UP" or "DOWN" to cycle through presets
	tunerPreset: function(preset) {
		Denon.sendMsg("TPAN"+preset.toUpperCase());
	},
	sendMsg: function (data) {
		if (Denon.enabled) {
			CF.send("Denon", data+"\x0D"); // Append carriage return for all Denon commands
		} else {
			CF.log("Denon Disabled - Could not send: " + data)
		}
	}
}

CF.modules.push({name:"Denon", setup:Denon.setup});