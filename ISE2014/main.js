var mainMenu = [
	{
		id: "cflink",
		icon: "icon_large_cflogo_on.png",
		name: "CFLink Discovery & Control",
		title: "CFLink Discovery",
		defaultSubItem: "ethernet"
	},
	{
		id: "knx",
		icon: "icon_large_knxlogo_on.png",
		name: "KNX Integration",
		title: "KNX Integration",
		defaultSubItem: "demo"
	},
	{
		id: "xbmc",
		icon: "icon_large_media_on.png",
		name: "Media Server Integration",
		title: "Media Server",
		defaultSubItem: "movieListing",
		defaultSubTitle: "Movies"
	},
	{
		id: "xdemo",
		icon: "icon_large_home_on.png",
		name: "Demo System",
		defaultSubItem: "security",
		defaultSubTitle: "Security"
	}
];

var RoomNames = {
	"masterbedroom" : "Master Bedroom",
	"patio" : "Patio",
	"livingroom" : "Living Room",
	"hometheatre" : "Home Theatre",
	"kitchen" : "Kitchen",
	"diningroom" : "Dining Room",
	"masterensuite" : "Master Ensuite",
	"bedroom2" : "Bedroom 2",
	"office" : "Office",
	"entry" : "Entry",
	"boardroom" : "Boardroom"
}

var SensorNames = {
	"24" : { // CFLink ID 22 (SW16)
		"watchContacts" : {
			"1" : {  // Port 01
				"eventName" : "Keypad Button 1 Pressed",
				"tagName" : null
			},
			"2" : {
				"eventName" : "Keypad Button 2 Pressed",
				"tagName" : null
			},
			"3" : {
				"eventName" : "Keypad Button 3 Pressed",
				"tagName" : null
			},
			"4" : {
				"eventName" : "Keypad Button 4 Pressed",
				"tagName" : null
			},
			"15" : {
				"eventName" : "Patio Motion Detected",
				"tagName" : "motion_patio",
				"timeout": null
			},
			"12" : {
				"eventName" : "Living Room Motion Detected",
				"tagName" : "motion_livingroom",
				"timeout": null
			},
			"13" : {
				"eventName" : "Dining Room Motion Detected",
				"tagName" : "motion_diningroom",
				"timeout": null
			},
			"16" : {
				"eventName" : "Home Theatre Motion Detected",
				"tagName" : "motion_hometheatre",
				"timeout": null
			},
			"5" : {
				"eventName" : "Kitchen Motion Detected",
				"tagName" : "motion_kitchen",
				"timeout": null
			},
			"6" : {
				"eventName" : "Office Motion Detected",
				"tagName" : "motion_office",
				"timeout": null
			},
			"7" : {
				"eventName" : "Boardroom Motion Detected",
				"tagName" : "motion_boardroom",
				"timeout": null
			},
			"14" : {
				"eventName" : "Entry Motion Detected",
				"tagName" : "motion_entry",
				"timeout": null
			},
			"9" : {
				"eventName" : "Master Bedroom Motion Detected",
				"tagName" : "motion_masterbedroom",
				"timeout": null
			},
			"10" : {
				"eventName" : "Master Ensuite Motion Detected",
				"tagName" : "motion_masterensuite",
				"timeout": null
			},
			"11" : {
				"eventName" : "Bedroom 2 Motion Detected",
				"tagName" : "motion_bedroom2",
				"timeout": null
			},
			"8" : {
				"eventName" : "Door Bell Pressed",
				"tagName" : "button_doorbell",
				"timeout": null
			}
		},
		"watchLEDs" : {
			"9" : {
				"eventName" : "Patio",
				"tagName" : "light_patio"
			},
			"13" : {
				"eventName" : "Living Room",
				"tagName" : "light_livingroom"
			},
			"14" : {
				"eventName" : "Dining Room",
				"tagName" : "light_diningroom"
			},
			"15" : {
				"eventName" : "Home Theatre",
				"tagName" : "light_hometheatre"
			},
			"16" : {
				"eventName" : "Kitchen",
				"tagName" : "light_kitchen"
			},
			"11" : {
				"eventName" : "Master Ensuite",
				"tagName" : "light_masterensuite"
			},
			"12" : {
				"eventName" : "Bedroom 2",
				"tagName" : "light_bedroom2"
			},
			"10" : {
				"eventName" : "Master Bedroom",
				"tagName" : "light_masterbedroom"
			}
		},
		"watchBacklightLEDs" : {
			"1" : {
				"eventName" : "Door Bell",
				"tagName" : ""
			},
			"2" : {
				"eventName" : "Boardroom",
				"tagName" : "light_boardroom"
			},
			"3" : {
				"eventName" : "Office",
				"tagName" : "light_office"
			},
			"4" : {
				"eventName" : "Entry",
				"tagName" : "light_entry"
			}
		}
	},
	"20" : {
		"watchRelays" : {
			"1" : {
				"eventName0" : "Front Door Locked",
				"eventName1" : "Front Door Unlocked",
				"tagName": "relay_frontdoor"
			}
		}
	}
};

// Global to store the menu item that was last selected
var currentSubID = currentCFLinkDevice = currentEthernetDevice = watchIDDiscovery = watchIDDirect = null;
var currentID = "menu";
var currentCFLinkDeviceWatchIDs = [];
var draggingSlider = false;

// XBMC object to control XBMC on the Raspberry Pi (RASPBMC 12.2)
var XBMCPI = new XBMC({ip: "192.168.0.31", port: 80});

// Single frame, rotation-based example:
var XBMCLoader = new SpinningAnimation({duration: 1, tag: "xbmc_transport_play", direction: 1, loop: true, bounce: false});

var myGUI = {};

var DISABLE_CFLINK = false;

var myRGB = new RGBController({systemName: "RGB Controller", address: 0x4C});
var myColorPicker, demoColorPicker;

// KNX
var system = "Apple KNX IP Interface V2.2"
var fbObject201 = "2Byte_Feedback_Object_201_Status"
var fbObject202 = "2Byte_Feedback_Object_202_Status"

//<editor-fold desc="---CFLINK PROCESSING">

/* Intercept and log ALL network dialog that CFLink sees */
//CFLink.interceptNetworkDialog = function(incoming, systemName, data) {
//	var cflinkID = "[" + ("00" + data.charCodeAt(1).toString(16).toUpperCase()).slice(-2) + "] ";
//
//	if (incoming) {
//		CF.log(" IN: [" + systemName + "]" + cflinkID + data.substring(3));
//	} else {
//		CF.log("OUT: [" + systemName + "]" + cflinkID + data.substring(3));
//	}
//};
function deviceDiscovered (systemName, device, ethernetScan) {
	CF.log("Device Discovered: " + device.cflinkID + ": " + device.model);
	if (ethernetScan && device.ipAddress) {
		CF.listAdd("lcflink_ethernetList", [{"s1": device.model, "s2": device.getCFLinkID(), "s3": device.ipAddress, "d1" : { tokens : { "serialNum" : device.serialNum }}}]);
	}
	if (systemName == CFLink.systemName) {
		CF.listAdd("lcflink_rescanList", [{"s1": device.model, "s2": device.getCFLinkID(), "d1" : { tokens : { "serialNum" : device.serialNum }}}]);
		// Loop through sensors object to listen to sensor events
		for (var cflinkID in SensorNames) {
			if (cflinkID == device.cflinkID) {
				// Matching device found...loop through its event types
				var sensorDevice = SensorNames[device.cflinkID];
				for (var eventName in sensorDevice) {
					if (typeof device[eventName] == "function") {
						device[eventName](null, function(device, portNum, state1, state2) {
							var eventName = this;
							var sensorDevice = SensorNames[device.cflinkID];
							var sensor = sensorDevice[eventName][portNum];
							// if not listening to events for this specific port, ignore it.
							if (!sensor) return;
							if (eventName == "watchContacts") {
								if (state1 == 0) {
									// When sensor triggers input closed, log an event and show it in the GUI
									logSecurityEvent(null, sensor.eventName);
									if (sensor.tagName) {
										// Hide all other sensor indicators except the one last triggered for demo GUI
										var sensorUpdates = [];
										for (var sensorPort in sensorDevice[eventName]) {
											if (sensorDevice[eventName][sensorPort].tagName) {
												sensorUpdates.push({
													join: sensorDevice[eventName][sensorPort].tagName,
													opacity: (sensorPort == portNum ? 1 : 0)
												});
											}
										}
										CF.setProperties(sensorUpdates, 0, 0.1);
										if (isAutoRoomSelectionEnabled) {
											selectRoom(sensor.tagName);
										}
									}
								}
							} else if (eventName == "watchRelays") {
								// When relay changes state, log an event and show it in the GUI
								logSecurityEvent(null, (state2 ? sensor.eventName1 : sensor.eventName0));
								if (sensor.tagName) {
									// Update any digital join based object (button, subpage, etc) assigned to the relay
									CF.setJoin(sensor.tagName, state2);
								}
							} else if (eventName == "watchLEDs" || eventName == "watchBacklightLEDs") {
								// When led level changes, update UI
								if (sensor.tagName) {
									CF.setProperties({join: sensor.tagName, opacity: state1 == "R" ? state2/100 : state2}, 0, 0.1, CF.AnimationCurveLinear, function() {
										// If the current room light is changing, update level on GUI
										if (sensor.tagName.indexOf(currentRoom)) {
											updateCurrentLightLevel();
										}
									});
								}
							}
						}, eventName);
					}
				}
			}
		}
	}
}

function hideEthernetDiscovery() {
	CF.setProperties({join: "cflink_ethernet", opacity: 0}, 0, 0.1);
}

function rescanEthernet() {

	// Enable discovery system and discovery callbacks
	CF.setSystemProperties(CFLink_Discovery.systemName, {enabled: true});
	CFLink_Discovery.deviceDiscovered = deviceDiscovered;
	CFLink.deviceDiscovered = null;

	CF.listRemove("lcflink_ethernetList");

	if (currentID == "cflink") {
		// We are on the CFLink discovery page
		// Show the ethernet scanning subpage
		CF.setProperties({join: "cflink_ethernet", opacity: 1}, 0, 0.1);
	}

	// Update UI to show scanning message
	CF.setJoin("cflink_scanning_msg", "Scanning for devices...");

	// Send scanning message
	CFLink_Discovery.rescan();

	setTimeout(function() {
		var count = CFLink_Discovery.deviceCount();
		CF.setJoin("cflink_scanning_msg", count + " Ethernet device"+(count > 1? "s" : "")+" found:");
	}, 3000);
}

function selectEthernetDevice (serialNum) {
	currentCFLinkDevice = CFLink_Discovery.devices[serialNum];
	if (!currentCFLinkDevice) {
		CF.log("Unable to select Ethernet device...");
		return;
	}
	// Hide the Ethernet device discovery popup
	hideEthernetDiscovery();

	// Disable discovery system and discovery callbacks
	CFLink.deviceDiscovered = deviceDiscovered;
	CFLink_Discovery.deviceDiscovered = null;
	CF.setSystemProperties(CFLink_Discovery.systemName, {enabled: false});
	CF.setSystemProperties(CFLink.systemName, {address: currentCFLinkDevice.ipAddress, enabled: true});

	submenuSelection('rescan');

	//setTimeout(rescanCFLink, 1000);
}

function rescanCFLink (autoStartupScan) {
	//submenuSelection("rescan", "CFLink Discovery");
	if (!autoStartupScan) {
		CF.listRemove("lcflink_rescanList");
		CF.listRemove("lcflink_deviceList");
		CFLink.initializeDeviceRegistry();
	}
	CFLink.startDiscovery();
}

function selectCFLinkDevice (serialNum) {

	CF.log("Selected: " + serialNum);
	// Stop watching events
	if (currentCFLinkDeviceWatchIDs.length) {
		for (var i = 0; i < currentCFLinkDeviceWatchIDs.length; i++) {
			//CF.log("Unwatch: " + currentCFLinkDeviceWatchIDs[i]);
			CFLink.unwatch(currentCFLinkDeviceWatchIDs[i]);
		}
		// Remove all watch IDs
		currentCFLinkDeviceWatchIDs = [];
	}

	// Hide previous device subpage
	CF.listRemove("lcflink_deviceList");

	currentCFLinkDevice = CFLink.getDeviceBySerialNumber(serialNum);
	if (!currentCFLinkDevice) {
		CF.log("Device not found: " + serialNum);
		return;
	}

	// Show device subpages
	var listItems = [
		{
			subpage: "cflink_model",
			s1: currentCFLinkDevice.model + " [" + currentCFLinkDevice.getCFLinkID() + "]"
		}
	];

	listItems = showDevicePorts(currentCFLinkDevice, listItems);

	// Show Digital Input status buttons
	if (currentCFLinkDevice.modules) {
		// This array is used to remember the join string, in list format
		// to use for updating each button to reflect the actual relay state.
		var listJoins = [];
		for (var i = 0; i < currentCFLinkDevice.modules.length; i++) {
			var module = currentCFLinkDevice.modules[i];
			if (!module) {
				// EMPTY MODULE SLOT
				listItems.push({ title: true, s1: "MODULE " + (i+1) + ": EMPTY"});
			} else {
				// Add a title item
				listItems.push({ title: true, s1: "MODULE " + (i+1) + ": " + module.model });
				listItems = showDevicePorts(module, listItems);
			}
		}
	}

	// Add all the list items for the selected device
	CF.listAdd("lcflink_deviceList", listItems);
}

function showDevicePorts(theDevice, listItems) {
	var isModule = theDevice.moduleNum;

	// Show any network settings settings
	if (theDevice.ipAddress) {
		// This array is used to remember the join string, in list format
		var listJoins = [];
		// Add a title item
		listItems.push({ title: true, s1: "Network Configuration" });
		listItems.push({
			subpage: "cflink_network",
			s1: theDevice.ipAddress,
			s2: theDevice.subnetMask,
			s3: theDevice.gateway,
			s4: theDevice.dns,
			s5: theDevice.broadcastEnabled ? "ENABLED" : "DISABLED"
		});
		listJoins.push(listItems.length-1);
	}

	// Show any on-board RS232 settings
	if (theDevice.rs232Port) {
		// This array is used to remember the join string, in list format
		// to use for updating the COM port state
		var listJoins = [];
		// Add a title item
		listItems.push({ title: true, s1: "On-board RS232 Port" });
		listItems.push({
			subpage: "cflink_rs232",
			s1: theDevice.rs232Port.mode,
			s2: theDevice.rs232Port.baud,
			s3: theDevice.rs232Port.parity,
			s4: theDevice.rs232Port.flowControl,
			s5: theDevice.rs232Port.stopBits
		});
		listJoins.push(listItems.length-1);

		// Listen to IO state changes (we stop listening for these when a different device is selected).
		// Store the watch ID in an array so we can unwatch all device notifications when a new device is selected.
		currentCFLinkDeviceWatchIDs.push(
			theDevice.watchCOMPortConfig(function(deviceObject, rs232Port) {

				CF.setJoins([
					{join: "l99:"+this[0]+":s1", value: rs232Port.mode},
					{join: "l99:"+this[0]+":s1", value: rs232Port.baud},
					{join: "l99:"+this[0]+":s2", value: rs232Port.parity},
					{join: "l99:"+this[0]+":s4", value: rs232Port.flowControl},
					{join: "l99:"+this[0]+":s5", value: rs232Port.stopBits}
				]);
			}, listJoins) // The array of list joins is sent as the 'this' object so we can use it to update the correct join on port change event callback
		);
	}

	// Show any communication slot settings
	if (theDevice.slots) {
		// This array is used to remember the join string, in list format
		var listJoins = [];
		// Add a title item
		listItems.push({ title: true, s1: "Communication Slots" });
		// Add column titles
		listItems.push({ subpage: "cflink_commslots_title" });
		for (var i = 10; i < theDevice.slots.length; i++) {
			if (!theDevice.slots[i]) {
				continue;
			}
			var mode = "OFF";
			if (theDevice.slots[i].type == "TCP") {
				mode = "TCP " + (theDevice.slots[i].mode == "S" ? "SERVER" : "CLIENT");
			} else if (theDevice.slots[i].type == "UDP") {
				mode = "UDP " + (theDevice.slots[i].mode == "B" ? "BROADCAST" : "UNICAST");
			}
			listItems.push({
				subpage: "cflink_commslots",
				s1: theDevice.slots[i].slotNum,
				s2: mode,
				s3: theDevice.slots[i].ipAddress,
				s4: theDevice.slots[i].port,
				s5: theDevice.slots[i].maxConnections
			});
			listJoins.push(listItems.length-1);
		}
	}

	// Show any COM port settings
	if (theDevice.COMPorts) {
		// This array is used to remember the join string, in list format
		// to use for updating the COM port state
		var listJoins = [];
		// Add each relay row, with 4 relay buttons per row
		for (var i = 0; i < theDevice.COMPorts.length; i++) {
			// Add a title item
			listItems.push({ title: true, s1: "COM Port " + (i+1) });
			listItems.push({
				subpage: "cflink_com",
				s1: theDevice.COMPorts[i].mode,
				s2: theDevice.COMPorts[i].baud,
				s3: theDevice.COMPorts[i].parity,
				s4: theDevice.COMPorts[i].flowControl,
				s5: theDevice.COMPorts[i].stopBits
			});
			listJoins.push(listItems.length-1);
		}

		// Listen to IO state changes (we stop listening for these when a different device is selected).
		// Store the watch ID in an array so we can unwatch all device notifications when a new device is selected.
		currentCFLinkDeviceWatchIDs.push(
			theDevice.watchCOMPortConfig(function(deviceObject, moduleObject) {
				for (var i = 0; i < moduleObject.COMPorts.length; i++) {
					var comPort = moduleObject.COMPorts[i];
					CF.setJoins([
						{join: "l99:"+this[i]+":s1", value: comPort.mode},
						{join: "l99:"+this[i]+":s1", value: comPort.baud},
						{join: "l99:"+this[i]+":s2", value: comPort.parity},
						{join: "l99:"+this[i]+":s4", value: comPort.flowControl},
						{join: "l99:"+this[i]+":s5", value: comPort.stopBits}
					]);
				}
			}, listJoins) // The array of list joins is sent as the 'this' object so we can use it to update the correct join on port change event callback
		);
	}

	// Show relay buttons to test relays if necessary
	if (theDevice.Relays && theDevice.Relays.length) {
		// This array is used to remember the join string, in list format
		// to use for updating each button to reflect the actual relay state.
		var listJoins = [];
		// Add a title item
		listItems.push({ title: true, s1: "Relays" });
		// Add each relay row, with 4 relay buttons per row
		for (var i = 0; i < theDevice.Relays.length; i+=4) {
			listItems.push({
				subpage: (isModule ? "cflink_relays_module" : "cflink_relays"),
				s1: (theDevice.Relays[i] ? "Relay " + (i+1) : "NA"),
				s2: (theDevice.Relays[i+1] ? "Relay " + (i+2) : "NA"),
				s3: (theDevice.Relays[i+2] ? "Relay " + (i+3) : "NA"),
				s4: (theDevice.Relays[i+3] ? "Relay " + (i+4) : "NA"),
				d1: {
					tokens : {
						"portNum" : i + 1,
						"moduleNum" : isModule
					},
					value: (theDevice.Relays[i] ? theDevice.Relays[i].state > 0 : 0),
					opacity: (theDevice.Relays[i] ? 1 : 0)
				},
				d2: {
					tokens : {
						"portNum" : i + 2,
						"moduleNum" : isModule
					},
					value: (theDevice.Relays[i+1] ? theDevice.Relays[i+1].state > 0 : 0),
					opacity: (theDevice.Relays[i+1] ? 1 : 0)
				},
				d3: {
					tokens : {
						"portNum" : i + 3,
						"moduleNum" : isModule
					},
					value: (theDevice.Relays[i+2] ? theDevice.Relays[i+2].state > 0 : 0),
					opacity: (theDevice.Relays[i+2] ? 1 : 0)
				},
				d4: {
					tokens : {
						"portNum" : i + 4,
						"moduleNum" : isModule
					},
					value: (theDevice.Relays[i+3] ? theDevice.Relays[i+3].state > 0 : 0),
					opacity: (theDevice.Relays[i+3] ? 1 : 0)
				}
			});

			listJoins.push(listItems.length-1,listItems.length-1,listItems.length-1,listItems.length-1);
		}

		// Listen to relay state changes (we stop listening for these when a different device is selected).
		// Store the watch ID in an array so we can unwatch all device notifications when a new device is selected.
		if (isModule) {
			currentCFLinkDeviceWatchIDs.push(
				theDevice.watchRelays(null, function(deviceObject, moduleObj, portNumber, previousValue, newValue) {
					CF.log(this[portNumber-1] + " = " + newValue);
					CF.setJoin("l99:"+this[portNumber-1]+":d"+(portNumber%4 || 4), newValue);
				}, listJoins) // The array of list joins is sent as the 'this' object so we can use it to update the correct join on port change event callback
			);
		} else {
			currentCFLinkDeviceWatchIDs.push(
				theDevice.watchRelays(null, function(deviceObject, portNumber, previousValue, newValue) {
					CF.log(this[portNumber-1] + " = " + newValue);
					CF.setJoin("l99:"+this[portNumber-1]+":d"+(portNumber%4 || 4), newValue);
				}, listJoins) // The array of list joins is sent as the 'this' object so we can use it to update the correct join on port change event callback
			);
		}

	}

	// Show IO status buttons
	if (theDevice.IOPorts && theDevice.IOPorts.length) {
		// This array is used to remember the join string, in list format
		// to use for updating each button to reflect the actual relay state.
		var listJoins = [];
		// Add a title item
		listItems.push({ title: true, s1: "IO Ports" });
		// Add each IO row, with 4 ports per row
		for (var i = 0; i < theDevice.IOPorts.length; i+=4) {
			listItems.push({
				subpage: "cflink_ioports",
				s1: theDevice.getIOPort(i+1).getModeString(),
				s2: theDevice.getIOPort(i+2).getModeString(),
				s3: theDevice.getIOPort(i+3).getModeString(),
				s4: theDevice.getIOPort(i+4).getModeString(),
				s5: theDevice.getIOPort(i+1).stateString(),
				s6: theDevice.getIOPort(i+2).stateString(),
				s7: theDevice.getIOPort(i+3).stateString(),
				s8: theDevice.getIOPort(i+4).stateString(),
				d1: {
					tokens : {
						"portNum" : i + 1
					},
					value: theDevice.IOPorts[i].state > 0
				},
				d2: {
					tokens : {
						"portNum" : i + 2
					},
					value: theDevice.IOPorts[i+1].state > 0
				},
				d3: {
					tokens : {
						"portNum" : i + 3
					},
					value: theDevice.IOPorts[i+2].state > 0
				},
				d4: {
					tokens : {
						"portNum" : i + 4
					},
					value: theDevice.IOPorts[i+3].state > 0
				}
			});

			listJoins.push(listItems.length-1, listItems.length-1, listItems.length-1, listItems.length-1);
		}

		// Listen to IO state changes (we stop listening for these when a different device is selected).
		// Store the watch ID in an array so we can unwatch all device notifications when a new device is selected.
		if (isModule) {
			currentCFLinkDeviceWatchIDs.push(
				theDevice.watchIOPorts(null, function(deviceObject, moduleObj, portNumber, previousValue, newValue) {
					CF.log(this[portNumber-1] + " = " + newValue);
					CF.setJoin("l99:"+this[portNumber-1]+":d"+(portNumber%4 || 4), newValue);
					CF.setJoin("l99:"+this[portNumber-1]+":s"+((portNumber%4 || 4)+4), moduleObj.getIOPort(portNumber).stateString());
				}, listJoins) // The array of list joins is sent as the 'this' object so we can use it to update the correct join on port change event callback
			);
		} else {
			currentCFLinkDeviceWatchIDs.push(
				theDevice.watchIOPorts(null, function(deviceObject, portNumber, previousValue, newValue) {
					CF.log(this[portNumber-1] + " = " + newValue);
					CF.setJoin("l99:"+this[portNumber-1]+":d"+(portNumber%4 || 4), newValue);
					CF.setJoin("l99:"+this[portNumber-1]+":s"+((portNumber%4 || 4)+8), deviceObject.getIOPort(portNumber).stateString());
				}, listJoins) // The array of list joins is sent as the 'this' object so we can use it to update the correct join on port change event callback
			);
		}
	}

	// Show Digital Input status buttons
	if (theDevice.dryContacts && theDevice.dryContacts.length) {
		// This array is used to remember the join string, in list format
		// to use for updating each button to reflect the actual relay state.
		var listJoins = [];
		// Add a title item
		listItems.push({ title: true, s1: "Dry Contact Inputs" });
		// Add each input row, with 4 ports per row
		for (var i = 0; i < theDevice.dryContacts.length; i+=4) {
			listItems.push({
				subpage: "cflink_digitalinputs",
				s1: "Input " + (i+1),
				s2: "Input " + (i+2),
				s3: "Input " + (i+3),
				s4: "Input " + (i+4),
				d1: {
					tokens : {
						"portNum" : i + 1
					},
					value: theDevice.dryContacts[i] > 0
				},
				d2: {
					tokens : {
						"portNum" : i + 2
					},
					value: theDevice.dryContacts[i+1] > 0
				},
				d3: {
					tokens : {
						"portNum" : i + 3
					},
					value: theDevice.dryContacts[i+2] > 0
				},
				d4: {
					tokens : {
						"portNum" : i + 4
					},
					value: theDevice.dryContacts[i+3] > 0
				}
			});

			listJoins.push(listItems.length-1, listItems.length-1, listItems.length-1, listItems.length-1);
		}

		// Listen to IO state changes (we stop listening for these when a different device is selected).
		// Store the watch ID in an array so we can unwatch all device notifications when a new device is selected.
		currentCFLinkDeviceWatchIDs.push(
			theDevice.watchContacts(null, function(deviceObject, portNumber, state) {
				CF.setJoin("l99:"+this[portNumber-1]+":d"+(portNumber%4 || 4), state);
			}, listJoins) // The array of list joins is sent as the 'this' object so we can use it to update the correct join on port change event callback
		);
	}

	// Show Digital Input status buttons
	if (theDevice.LEDs && theDevice.LEDs.length) {
		// This array is used to remember the join string, in list format
		// to use for updating each button to reflect the actual relay state.
		var listJoins = [];
		// Add a title item
		listItems.push({ title: true, s1: "LED Outputs" });
		// Add each input row, with 4 ports per row
		for (var i = 0; i < theDevice.LEDs.length; i+=4) {
			listItems.push({
				subpage: "cflink_leds",
				s1: "LED " + (i+1),
				s2: "LED " + (i+2),
				s3: "LED " + (i+3),
				s4: "LED " + (i+4),
				d1: {
					tokens : {
						"portNum" : i + 1
					},
					value: theDevice.LEDs[i].level > 0
				},
				d2: {
					tokens : {
						"portNum" : i + 2
					},
					value: theDevice.LEDs[i+1].level > 0
				},
				d3: {
					tokens : {
						"portNum" : i + 3
					},
					value: theDevice.LEDs[i+2].level > 0
				},
				d4: {
					tokens : {
						"portNum" : i + 4
					},
					value: theDevice.LEDs[i+3].level > 0
				}
			});

			listJoins.push(listItems.length-1, listItems.length-1, listItems.length-1, listItems.length-1);
		}

		// Listen to IO state changes (we stop listening for these when a different device is selected).
		// Store the watch ID in an array so we can unwatch all device notifications when a new device is selected.
		currentCFLinkDeviceWatchIDs.push(
			theDevice.watchLEDs(null, function(deviceObject, portNumber, state, level) {
				CF.log("port: " + portNumber + ", index: " + this[portNumber-1] + " = " + level);
				CF.setJoin("l99:"+this[portNumber-1]+":d"+(portNumber%4 || 4), level);
			}, listJoins) // The array of list joins is sent as the 'this' object so we can use it to update the correct join on port change event callback
		);
	}

	// Show Digital Input status buttons
	if (theDevice.backlightLEDs && theDevice.backlightLEDs.length) {
		// This array is used to remember the join string, in list format
		// to use for updating each button to reflect the actual relay state.
		var listJoins = [];
		// Add a title item
		listItems.push({ title: true, s1: "Backlight LED Outputs" });
		// Add each input row, with 4 ports per row
		for (var i = 0; i < theDevice.backlightLEDs.length; i+=4) {
			listItems.push({
				subpage: "cflink_backlightleds",
				s1: "Backlight " + (i+1),
				s2: "Backlight " + (i+2),
				s3: "Backlight " + (i+3),
				s4: "Backlight " + (i+4),
				d1: {
					tokens : {
						"portNum" : i + 1
					},
					value: theDevice.backlightLEDs[i].level > 0
				},
				d2: {
					tokens : {
						"portNum" : i + 2
					},
					value: theDevice.backlightLEDs[i+1].level > 0
				},
				d3: {
					tokens : {
						"portNum" : i + 3
					},
					value: theDevice.backlightLEDs[i+2].level > 0
				},
				d4: {
					tokens : {
						"portNum" : i + 4
					},
					value: theDevice.backlightLEDs[i+3].level > 0
				}
			});

			listJoins.push(listItems.length-1, listItems.length-1, listItems.length-1, listItems.length-1);
		}

		// Listen to IO state changes (we stop listening for these when a different device is selected).
		// Store the watch ID in an array so we can unwatch all device notifications when a new device is selected.
		currentCFLinkDeviceWatchIDs.push(
			theDevice.watchBacklightLEDs(null, function(deviceObject, portNumber, state, level) {
				CF.log("port: " + portNumber + ", index: " + this[portNumber-1] + " = " + level);
				CF.setJoin("l99:"+this[portNumber-1]+":d"+(portNumber%4 || 4), level);
			}, listJoins) // The array of list joins is sent as the 'this' object so we can use it to update the correct join on port change event callback
		);
	}

	// Show any IR Port settings
	if (theDevice.IRPorts && theDevice.model == "IRBlaster") {
		// This array is used to remember the join string, in list format
		// to use for updating the COM port state
		var listJoins = [];
		// Add a title item
		listItems.push({ title: true, s1: "IR Code Memory" });
		listItems.push({
			subpage: "cflink_irmem"
		});
		listJoins.push(listItems.length-1);
	}

	return listItems;
}

var IRData = {
	"samsung" : {"pwrtoggle":"DBA:00:2051:01", "pwron":"DBA:00:2051:02", "pwroff":"DBA:00:2051:03", "volup":"DBA:00:2051:06", "voldown":"DBA:00:2051:07", "menu":"DBA:00:2051:29", "exit":"DBA:00:2051:32", "arrowup":"DBA:00:2051:33", "arrowright":"DBA:00:2051:36", "arrowdown":"DBA:00:2051:34", "arrowleft":"DBA:00:2051:35", "enter":"DBA:00:2051:37"}
};

function popupIRList (device) {
	// Clear IR code list
	CF.listRemove("lcflink_irListing");

	// Set title
	CF.setJoin("cflink_irdevicename", device);

	// Show the subpage
	CF.setProperties({join: "cflink_ircodes", opacity: 1}, 0, 0.1);

	var listData = [];
	var ircodeArray = IRData[device];
	for (var code in ircodeArray) {
		listData.push({"s1": code, "d1" : {
			tokens : {
				"device": device,
				"function" : code
			}
		}});
	}
	// Add all the code items to the list
	CF.listAdd("lcflink_irListing", listData);

}

function getIRCommand(device, code) {
	return IRData[device][code];
}

function sendIRCodeFromMemory(device, code) {
	if (IRData.hasOwnProperty(device)) {
		code = getIRCommand(device, code);
		if (code) {
			CFLink.buildMsg(CFLink.systemName, currentCFLinkDevice.cflinkID, "T", "IRX", "SND", "P01:" + code);
		} else {
			CF.log("IR Memory code function not found - device: " + device + ", code: " + code);
		}
	} else {
		CF.log("IR Memory device not found: " + device);
	}
}
//</editor-fold>

CF.userMain = function() {
	ArtNet.stopFlooding();

	// Setup queue for LED sign sequences
	Q = $({});

	// Hide all subpages at the start
	CF.getGuiDescription(function (gui) {
		myGUI = gui;
		var setupChanges = [],
			subpages = gui.subpages;

		for (var i = 0; i < mainMenu.length; i++) {
			for (var j = 0; j < subpages.length; j++) {
				if (subpages[j].name.indexOf(mainMenu[i].id) == 0) {
					setupChanges.push({"join" : subpages[j].name, opacity: 0});
				}
			}
		}

		//CF.logObject(setupChanges);
		CF.setProperties(setupChanges);

		if (!DISABLE_CFLINK) {

			// Define the name of the system that CFLink will use
			CFLink.systemName = "CFLINK";
			CFLink_Discovery.systemName = "CFLINK_DISCOVERY";

			// Disable the system until we have selected a specific Ethernet device to query
			CF.setSystemProperties(CFLink.systemName, {enabled: false});

			// Watch the data coming from CFLink in JavaScript
			// Without this, the whole CFLink JS API won't be able to fire events or parse incoming data
			watchIDDirect = CF.watch(CF.FeedbackMatchedEvent, CFLink.systemName, "IncomingCFLinkData", CFLink.incomingData);

			// Rescan the CFLink networking whenever the system connects/reconnects
			CF.watch(CF.ConnectionStatusChangeEvent, CFLink.systemName, function(system, connected, remote) {
				if (connected) {
					rescanCFLink(true);
				}
			});

			// Watch the data coming from CFLink_Discovery in JavaScript
			watchIDDiscovery = CF.watch(CF.FeedbackMatchedEvent, CFLink_Discovery.systemName, "IncomingCFLinkDiscoveryData", CFLink_Discovery.incomingData);

			setTimeout(function(){rescanEthernet();}, 1000);
		}
	});

	CF.setSystemProperties("XBMC_Notifications", {address: XBMCPI.ip});

	CF.watch(CF.FeedbackMatchedEvent, "XBMC_Notifications", "XBMC Notification", function(feedbackName, data) {
		var data = JSON.parse(data);
		CF.logObject(data, 20);
		XBMCPI.processNotification(data);
	});

	XBMCPI.mediaChanged = function(newid) {
		if (XBMCPI.currentlyPlaying.type == "movie") {
			XBMCPI.rpc("VideoLibrary.GetMovieDetails", { "movieid": newid, "properties": ["thumbnail","fanart","title","plot","genre","year","rating","runtime","director","writer","file"] }, function(movieData) {
				CF.logObject(movieData);
				movieData = movieData.result.moviedetails;
				CF.setJoins([
					{ join: "xbmc_playing_artwork", value: XBMCPI.imgURL + movieData.thumbnail },
					{ join: "xbmc_playing_title", value:  movieData.title },
					{ join: "xbmc_playing_year", value:  movieData.year },
					{ join: "xbmc_playing_runtime", value: ", Runtime: " + Math.ceil(movieData.runtime/60) + "mins" + (movieData.runtime < 600 ? " (trailer)" : "") }
				]);
			});
		}
	};

	XBMCPI.playStateChanged = function(mediaChanged) {
		if (XBMCPI.currentlyPlaying.type == "movie") {
			CF.setJoins([
				{ join: "xbmc_transport_play", value: XBMCPI.currentlyPlaying.speed > 0 ? "icon_large_pause_off.png" : "icon_large_play_off.png" },
				{ join: "xbmc_playing_elapsed", value: (XBMCPI.currentlyPlaying.time.hours > 0 ? XBMCPI.currentlyPlaying.time.hours + ":" : "") + ("0"+XBMCPI.currentlyPlaying.time.minutes).slice(-2) + ":" + ("0"+XBMCPI.currentlyPlaying.time.seconds).slice(-2) },
				{ join: "xbmc_playing_duration", value: (XBMCPI.currentlyPlaying.totaltime.hours > 0 ? XBMCPI.currentlyPlaying.totaltime.hours + ":" : "") + ("0"+XBMCPI.currentlyPlaying.totaltime.minutes).slice(-2) + ":" + ("0"+XBMCPI.currentlyPlaying.totaltime.seconds).slice(-2) },
				{ join: draggingSlider ? "DO-NOT-UPDATE-SLIDER" : "xbmc_playing_progressbar", value: (65535/100)*XBMCPI.currentlyPlaying.percentage }
			]);
			if (XBMCPI.currentlyPlaying.speed >= 0) {
				if (mediaChanged) {
					showFooter("xbmc");
				}
			} else {
				hideFooter("xbmc");
			}
		}
	};

	// Watch the progress bar slide
	var progressSlider = "a11",
		lightSlider = "a12";
	CF.watch(CF.ObjectPressedEvent, progressSlider, function(join,value,tokens,tags) {
		draggingSlider = true;
	});
	CF.watch(CF.ObjectDraggedEvent, progressSlider, function(join,value,tokens,tags) {
		if (!XBMCPI.seeking) {
			XBMCPI.seek((value/65535)*100);
		}
	});
	// current light slider
	CF.watch(CF.ObjectReleasedEvent, progressSlider, function(join,value,tokens,tags) {
		draggingSlider = false;
	});
	CF.watch(CF.ObjectPressedEvent, lightSlider, function(join,value,tokens,tags) {
		draggingSlider = true;
	});
	CF.watch(CF.ObjectReleasedEvent, lightSlider, function(join,value,tokens,tags) {
		draggingSlider = false;
	});

	// Tell XBMC to initialize
	XBMCPI.init();

	// KNX
	CF.watch(CF.FeedbackMatchedEvent, system, fbObject201, onAnalogJoinFeedback);
	CF.watch(CF.FeedbackMatchedEvent, system, fbObject202, onAnalogJoinFeedback);

	// Hide the main menu
	CF.setProperties({join: "menu", opacity: 0});
	hidePopup("menu_shutdown");

	// Setup the main menu
	CF.listRemove("l1");

	var i = 0,
		listData = [];

	for ( ; i < mainMenu.length; i++) {
		listData.push({"s1": mainMenu[i].icon, "s2": mainMenu[i].name, "d1" : {
			tokens: {
				"menu_id" : mainMenu[i].id
			}
		}});
	}

	CF.listAdd("l1", listData);

	// Show the main menu
	CF.setProperties({join: "menu", opacity: 1.0}, 0, 1);

	// Hide all sensor indicators
	var sensorUpdates = [];
	for (var cflinkID in SensorNames) {
		var sensorDevice = SensorNames[cflinkID];
		for (var eventName in sensorDevice) {
			var sensorEvent = sensorDevice[eventName];
			for (var sensorPort in sensorEvent) {
				var sensor = sensorEvent[sensorPort];
				if (sensor.tagName) {
					if (eventName == "watchContacts") {
						sensorUpdates.push({join: sensor.tagName, opacity: 0});
					}
				}
			}
		}
	}
	CF.setProperties(sensorUpdates, 0,0);

	// Hide the current room controls
	CF.setProperties({join: "current_room_control", opacity: 0});

	// Create our httpserver for camera event listening
	var dataServer = httpServer("CameraEventServer", "CameraEventFeedback");

	// Override the function to handle incoming requests
	dataServer.onRequestReceived = function(requestType, command, path, requestHeaders) {
		CF.log("Path: " + path);
		CF.log("Command: " + command);
		var headers = {};
		headers["Content-Type"] = "text/html";
		if (path.indexOf("/weather") == 0) {
			CF.log("WEATHER REQUEST: " + path);
			CF.loadAsset("weather.html", CF.UTF8, function(body) {
				dataServer.sendResponse(headers, body, false);
			});
		} else {
			var event = path.split("?");
			logSecurityEvent(null, "CAMERA MOTION DETECTED: " + event[1]);
			dataServer.sendResponse(headers, "OK", false);
		}
	};

	// Start the HTTP Server
	dataServer.start();

	// Listen to custom events from CFLink such as Remote triggers
	CF.watch(CF.FeedbackMatchedEvent, "CFLink Events", "CFLinkEventFeedback", function(feedbackName, data) {
		// Example data format: {"remote": "kscape", "button": "red"}
		CF.log("CFLink Event Feedback: " + data);
		var data = JSON.parse(data);
		logSecurityEvent(null, "REMOTE BUTTON PRESS: " +data.remote + " - " + data.button);
		switch (data.button) {
			case "menu" :
				goHome();
				break;
			case "nowplaying" :
				changeMainMenu("xbmc");
				break;
			case "movies" :
				if (currentID == "xbmc") {
					submenuSelection("movie", "Movies");
				}
				break;
			case "music" :
				if (currentID == "xbmc") {
					submenuSelection("music", "Music");
				}
				break;
		}
	});

	// Setup color picker for LED sign
	myColorPicker = new ColorPicker("picker-large.png", "s2", null, 100, function (r, g, b, a, x, y, wasDragged) {
		// This code will be run every time the pixel color is obtained, along with the pixel data as parameters

		ArtNet.setRGB(9, r, g, b);
		ArtNet.setRGB(10, r, g, b);
		ArtNet.setRGB(7, r, g, b);
		ArtNet.setRGB(6, r, g, b);
		ArtNet.setRGB(4, r, g, b);
		ArtNet.setRGB(3, r, g, b);
		ArtNet.setRGB(2, r, g, b);
		ArtNet.setRGB(0, r, g, b);
	});

	// Setup the colorpicker object after it was created above
	myColorPicker.setup();

	// Setup color picker for Demo board
	demoColorPicker = new ColorPicker("colorpicker.png", "s3", null, 100, function (r, g, b, a, x, y, wasDragged) {
		// This code will be run every time the pixel color is obtained, along with the pixel data as parameters
		myRGB.setRGBLevels(r, g, b, !wasDragged);
	});

	// Setup the colorpicker object after it was created above
	demoColorPicker.setup();
};

function getMenuByID(id) {
	for (var i = 0; i < mainMenu.length; i++) {
		if (mainMenu[i].id == id) {
			return mainMenu[i];
		}
	}
}

function goHome() {
	// Clear sub ID
	currentSubID = null;
	// First hide the current header and any subpages
	CF.setProperties([{join: currentID + "_header", y: -250}, {join: currentID + "_footer", y: 1024}, {join: currentID + "_footer_toggle", zrotation: 0}], 0, 0.3, CF.AnimationCurveEaseOut, function() {
		// Position new header off screen ready to animate in from top
		CF.setProperties([{join: "menu_header", y: -250, opacity: 1.0}, {join: "menu_footer", y: 1024, opacity: 1.0}], 0, 0, CF.AnimationCurveLinear, function() {
			// Show the menu header
			CF.setProperties([{join: "menu_header", y: 0}, {join: "menu_footer", y: 924}], 0.2, 0.3, CF.AnimationCurveEaseOut);

			// Hide all subpages relating to the last visit ID
			var setupChanges = [], subpages = myGUI.subpages;
			for (var i = 0; i < subpages.length; i++) {
				if (subpages[i].name.indexOf(currentID) == 0) {
					setupChanges.push({"join" : subpages[i].name, opacity: 0});
				}
			}
			CF.setProperties(setupChanges, 0, 0.3, CF.AnimationCurveEaseOut, function() {
				// Show the main menu
				CF.setProperties({join: "menu", opacity: 1.0, scale: 1.0}, 0, 0.3, CF.AnimationCurveEaseOut, function() {
					currentID = "menu";
				});
			});
		});
	});
}

function changeMainMenu(newID) {
	// Clear sub ID
	currentSubID = null;
	// First hide the current header and any subpages
	CF.setProperties([{join: currentID + "_header", y: -250}, {join: currentID + "_footer", y: 1024}, {join: currentID + "_footer_toggle", zrotation: 0}], 0, 0.3, CF.AnimationCurveEaseOut, function() {
		// Position new header off screen ready to animate in from top
		CF.setProperties([{join: "menu_header", y: -250, opacity: 1.0}, {join: "menu_footer", y: 1024, opacity: 1.0}], 0, 0, CF.AnimationCurveLinear, function() {
			// Hide all subpages relating to the last visit ID
			var setupChanges = [], subpages = myGUI.subpages;
			for (var i = 0; i < subpages.length; i++) {
				if (subpages[i].name.indexOf(currentID) == 0) {
					setupChanges.push({"join" : subpages[i].name, opacity: 0});
				}
			}
			CF.setProperties(setupChanges, 0, 0.3, CF.AnimationCurveEaseOut, function() {
				// Now select the new main menu ID
				mainMenuSelection(newID);
			});
		});
	});
}

function mainMenuSelection(id) {
	// Main menu item was selected, get the info via its ID and setup relevant subpages
	CF.log("Main Menu: " + id);

	currentID = id;

	var menuItem = getMenuByID(id);
	if (!menuItem) {
		CF.log("MAIN MENU ITEM COULD NOT BE FOUND!!");
		return;
	}

	var newTitle = menuItem.title || menuItem.name;

	// Check if there is a header subpage to show for the selected menu item.
	// If not, then we can ignore the menu selection altogether
	var subpages = myGUI.subpages, found = false;
	for (var i = 0; i < subpages.length; i++) {
		if (subpages[i].name == currentID + "_header") {
			found = true;
		}
	}
	if (!found) {
		CF.log("No header for the menu item was found, so it cannot be selected. Missing header subpage: " + currentID + "_header");
		return;
	}

	// First hide the current header/footer and the main menu
	CF.setProperties([{join: "menu_header", y: -250},{join: "menu_footer", y: 1024}], 0, 0.3, CF.AnimationCurveEaseOut);
	CF.setProperties({join: "menu", opacity: 0.0, scale: 0.1}, 0, 0.3, CF.AnimationCurveEaseOut, function() {
		// Set the header title
		CF.setJoin(id + "_title", newTitle);
		// Position new header off screen ready to animate in from top
		CF.setProperties([{join: id + "_header", y: -250, opacity: 1.0}, {join: id + "_footer", y: 1024, opacity: 1.0}], 0, 0, CF.AnimationCurveLinear, function() {
			// Show the new header
			if (menuItem.defaultSubItem) {
				newTitle = menuItem.defaultSubTitle || newTitle;
				CF.setProperties([{join: id + "_header", y: -125}, {join: id + "_footer", y: 924}], 0, 0.3, CF.AnimationCurveEaseOut, function() {
					submenuSelection(menuItem.defaultSubItem, newTitle);
				});
			} else {
				CF.setProperties([{join: id + "_header", y: 0}, {join: id + "_footer", y: 924}], 0, 0.3, CF.AnimationCurveEaseOut, function() {

				});
			}

		});
	});
}

function submenuSelection(id, newTitle) {
	// Move the header off screen
	CF.setProperties({join: currentID + "_header", y: -125}, 0, 0.2, CF.AnimationCurveEaseOut);

	// Only need to perform more actions if changing to a different screen
	if (currentSubID != id) {
		currentSubID = id;
		// Adjust the title
		if (newTitle) {
			CF.setJoin(currentID + "_title", newTitle);
		}
		// Hide all subpages
		var setupChanges = [], subpages = myGUI.subpages;
		for (var i = 0; i < subpages.length; i++) {
			if (subpages[i].name.indexOf(currentID) == 0 && subpages[i].name != currentID + "_header" && subpages[i].name != currentID + "_footer") {
				setupChanges.push({"join" : subpages[i].name, opacity: 0});
			}
		}
		CF.setProperties(setupChanges, 0, 0.3, CF.AnimationCurveEaseOut, function() {
			CF.setProperties({join: currentID+"_"+id, opacity: 1.0, scale: 1.0}, 0, 0.3, CF.AnimationCurveEaseOut, function() {
			});
		});
	}
}

function toggleHeader(id, callback) {
	id = id || currentID;
	CF.getProperties(id + "_header", function(props) {
		CF.setProperties({join: id + "_header", y: props.y == 0 ? -125 : 0}, 0, 0.2, CF.AnimationCurveEaseOut, function() {
			if (typeof callback == "function") {
				callback();
			}
		});
	});
}

function showHeader(callback, id) {
	id = id || currentID;
	CF.setProperties({join: currentID + "_header", y: 0}, 0, 0.2, CF.AnimationCurveEaseOut, function() {
		if (typeof callback == "function") {
			callback();
		}
	});
}

function toggleFooter(id, callback) {
	id = id || currentID;
	CF.getProperties(id + "_footer", function(props) {
		CF.setProperties({join: id + "_footer", y: props.y == 924 ? 774 : 924}, 0, 0.2, CF.AnimationCurveEaseOut, function() {
			CF.setProperties({join: id + "_footer_toggle", zrotation: props.y == 924 ? 180 : 0}, 0, 0.3);
			if (typeof callback == "function") {
				callback();
			}
		});
	});
}

function showFooter(id) {
	id = id || currentID;
	CF.setProperties({join: id + "_footer", y:  774}, 0, 0.2, CF.AnimationCurveEaseOut, function() {
		CF.setProperties({join: id + "_footer_toggle", zrotation: 180}, 0, 0.3);
	});
}

function hideFooter(id) {
	id = id || currentID;
	CF.setProperties({join: id + "_footer", y:  924}, 0, 0.2, CF.AnimationCurveEaseOut, function() {
		CF.setProperties({join: id + "_footer_toggle", zrotation: 0}, 0, 0.3);
	});
}

function goTop() {
	CF.listScroll("l"+currentID+"_"+currentSubID+"_list", 0, CF.TopPosition, true);
}


function showPopup(tagOrJoin) {
	CF.setProperties({join: tagOrJoin, opacity:  1}, 0, 0.1);
}
function hidePopup(tagOrJoin) {
	CF.setProperties({join: tagOrJoin, opacity:  0}, 0, 0.2);
}

function createTimeStamp() {
	var logDate = new Date();
	return logDate.getHours()+":"+("0"+logDate.getMinutes()).slice(-2)+":"+("0"+logDate.getSeconds()).slice(-2)+"."+("00"+logDate.getMilliseconds()).slice(-3);
}

function logSecurityEvent(timestamp, event) {
	timestamp = timestamp || createTimeStamp();
	CF.listAdd("lxdemo_security_log", [{"s1": timestamp, "s2": event}], 0);
}

var currentRoom = "";
function selectRoom(roomName) {
	if (roomName.indexOf("_") >= 0) {
		roomName = roomName.substr(roomName.indexOf("_") + 1);
	}

	if (isAutoRoomLightEnabled && roomName != currentRoom) {
		var sensorInfo = getSensorByTag("light_"+currentRoom);
		if (sensorInfo) {
			sensorInfo.sensor.timeout = setTimeout(function(theRoom) {
				setLightLevel(theRoom, 0);
			}, 3000, currentRoom);
		}
	}

	currentRoom = roomName;

	if (isAutoRoomLightEnabled) {
		var sensorInfo = getSensorByTag("light_"+currentRoom);
		if (sensorInfo) {
			clearTimeout(sensorInfo.sensor.timeout);
		}
		setLightLevel(currentRoom, 100);
	}

	// Hide the current room controls
	CF.setProperties({join: "current_room_control", opacity: 0}, 0, 0.2, CF.AnimationCurveEaseIn, function(){
		// Update the room light name, button states and slider level
		updateCurrentLightLevel(function() {
			// Show the controls again
			CF.setProperties({join: "current_room_control", opacity: 1}, 0, 0.2);
		});
	});
}

function updateCurrentLightLevel(callback) {
	// Update the room light name, button states and slider level
	CF.getProperties("light_"+currentRoom, function(props) {
		CF.setJoins([
			{
				join: "light_current_name",
				value: RoomNames[currentRoom]
			},
			{
				join: draggingSlider ? "NO UPDATE WHEN DRAGGING" : "light_current_level",
				value: 65535 * props.opacity
			},
			{
				join: "light_current_off",
				value: props.opacity == 0 ? 1 : 0
			},
			{
				join: "light_current_on",
				value: props.opacity > 0 ? 1 : 0
			}
		]);
		if (typeof callback == "function") {
			callback();
		}

	});
}

function setLightLevel(roomName, level, time) {
	roomName = roomName || currentRoom;
	//time = time || 1;
	time = 1; // HARD CODED FOR DEMO

	var sensorInfo = getSensorByTag("light_"+roomName);
	if (sensorInfo && sensorInfo.sensor.timeout !== null) {
		clearTimeout(sensorInfo.sensor.timeout);
	}
	if (sensorInfo.sensor) {
		// Found the light!
		var theDevice = CFLink.getDeviceByCFLinkID(sensorInfo.cflinkID);
		if (!theDevice) {
			CF.log("CFLink device not found for the light");
			return;
		}
		switch (sensorInfo.eventName) {
			case "watchLEDs" :
				theDevice.rampLED(sensorInfo.portNum, level, time);
				setTimeout(function(theDevice, portNum, time) {
					theDevice.rampLED(portNum, level, time);
				}, 500, theDevice, sensorInfo.portNum, time);
				break;
			case "watchBacklightLEDs" :
				theDevice.rampBacklightLED(sensorInfo.portNum, level,time);
				setTimeout(function(theDevice, portNum, time) {
					theDevice.rampBacklightLED(portNum, level, time);
				}, 500, theDevice, sensorInfo.portNum, time);
				break;
			default:
				CF.log("Event type unknown: " + sensorInfo.eventName);
				return;
		}
	}
}

// Find the correct CFLink device to send command to based on the tag name of a sensor
function getSensorByTag(tagName) {
	for (var cflinkID in SensorNames) {
		var sensorDevice = SensorNames[cflinkID];
		for (var eventName in sensorDevice) {
			var sensorEvent = sensorDevice[eventName];
			for (var portNum in sensorEvent) {
				var sensor = sensorEvent[portNum];
				if (sensor.tagName == tagName) {
					return {cflinkID: cflinkID, eventName: eventName, portNum: portNum, sensor: sensor};
				}
			}
		}
	}
}

var isAutoRoomSelectionEnabled = isAutoRoomLightEnabled = false;
function toggleAutoRoomSelection(join) {
	isAutoRoomSelectionEnabled = !isAutoRoomSelectionEnabled;
	if (isAutoRoomSelectionEnabled == false) {
		isAutoRoomLightEnabled = false;
	}
	if (join) {
		CF.setJoin(join, isAutoRoomSelectionEnabled);
	}
}

function toggleAutoRoomLight(join) {
	isAutoRoomLightEnabled = !isAutoRoomLightEnabled;
	if (join) {
		CF.setJoin(join, isAutoRoomLightEnabled);
	}
}

function runLightPreset(presetName) {
	switch (presetName) {
		case "ALL OFF":
			setLightLevel("masterbedroom", 0);
			setLightLevel("masterensuite", 0);
			setLightLevel("kitchen", 0);
			setLightLevel("patio", 0);
			setLightLevel("diningroom", 0);
			setLightLevel("livingroom", 0);
			setLightLevel("office", 0);
			setLightLevel("boardroom", 0);
			setLightLevel("hometheatre", 0);
			setLightLevel("bedroom2", 0);
			setLightLevel("entry", 0);
			break;
		case "LEAVE":
			setLightLevel("masterbedroom", 0);
			setLightLevel("masterensuite", 0);
			setLightLevel("kitchen", 0);
			setLightLevel("patio", 0);
			setLightLevel("diningroom", 0);
			setLightLevel("livingroom", 0);
			setLightLevel("office", 0);
			setLightLevel("boardroom", 0);
			setLightLevel("hometheatre", 0);
			setLightLevel("bedroom2", 0);
			setLightLevel("entry", 90);
			break;
		case "GOOD NIGHT":
			setLightLevel("masterbedroom", 0, 10);
			setLightLevel("masterensuite", 0, 10);
			setLightLevel("kitchen", 0, 10);
			setLightLevel("patio", 0, 10);
			setLightLevel("diningroom", 30, 10);
			setLightLevel("livingroom", 0, 10);
			setLightLevel("office", 0, 100);
			setLightLevel("boardroom", 0);
			setLightLevel("hometheatre", 0, 10);
			setLightLevel("entry", 0, 10);
			break;
		case "MORNING":
			setLightLevel("masterbedroom", 40);
			setLightLevel("kitchen", 80);
			setLightLevel("diningroom", 50);
			setLightLevel("livingroom", 50);
			setLightLevel("entry", 0);
			break;
		case "ENTERTAIN":
			setLightLevel("kitchen", 50);
			setLightLevel("patio", 50);
			setLightLevel("diningroom", 50);
			setLightLevel("livingroom", 50);
			setLightLevel("hometheatre", 20);
			setLightLevel("entry", 80);
			break;
		case "DINNER":
			setLightLevel("kitchen", 50);
			setLightLevel("diningroom", 50);
			setLightLevel("livingroom", 20);
			break;
	}
}

function shutdownTheatre() {
	// DO SOME STUFF HERE...
	setLightLevel("hometheatre", 0);

	var sensorInfo = getSensorByTag("relay_frontdoor");
	if (sensorInfo.sensor) {
		CFLink.getDeviceByCFLinkID(sensorInfo.cflinkID).setRelayState(1, 0);
	}
}

// KNX
function onAnalogJoinFeedback(item, text){
	var len = text.length;
	var objects = d2h(text.charCodeAt(len - 6));

	if (objects == 0) {   // 250 Objects

		var joinNumber = text.charCodeAt(len - 5);
		var valueHi = text.charCodeAt(len - 2);
		var valueLo = text.charCodeAt(len - 1);

		if (joinNumber > null) {
			CF.setJoin("a" + joinNumber, Eis52Value(valueHi * 256 + valueLo));
			var resultaat = (valueHi * 256 + valueLo)
			CF.log("a"+joinNumber);
		}
	}

	if (objects > 0) { // 1000 objects

		var joinNumber2 = h2d((d2h(text.charCodeAt(len - 6))) + (d2h(text.charCodeAt(len - 5))));
		var valueHi2 = text.charCodeAt(len - 2);
		var valueLo2 = text.charCodeAt(len - 1);

		if (joinNumber2 > null){
			CF.setJoin("a" + joinNumber2, Eis52Value(valueHi2 * 256 + valueLo2));
			var resultaat2 = (valueHi2 * 256 + valueLo2);
			CF.log("2 - a"+joinNumber);
		}

	}
}

function Eis52Value(eis5) {
	value = eis5 & 0x07ff;

	if ((eis5 & 0x08000) != 0){
		value |= 0xfffff800;
		value = -value;
	}
	value <<=  ((eis5 & 0x07800) >> 11);

	if ((eis5 & 0x08000) != 0)
		value = -value;
	value = value*0.01
	value = value.toFixed(1);
	return value  + "\xB0C"
}


function toHex(str) { str = str + ''; return Number(str).toString(16).toUpperCase(); }

function h2d(h) {return parseInt(h,16);}  // hex to decimal

function d2h(d) {return d.toString(16);}  // decimal to hex

function shutdownKNX() {

}