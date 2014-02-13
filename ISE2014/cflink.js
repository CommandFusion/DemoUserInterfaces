/**
 * Classy - classy classes for JavaScript
 *
 * :copyright: (c) 2011 by Armin Ronacher.
 * :license: BSD.
 */

;(function(undefined) {
	var
		CLASSY_VERSION = '1.4',
		root = this,
		old_class = root.Class,
		disable_constructor = false;

	/* we check if $super is in use by a class if we can.  But first we have to
	 check if the JavaScript interpreter supports that.  This also matches
	 to false positives later, but that does not do any harm besides slightly
	 slowing calls down. */
	var probe_super = (function(){$super();}).toString().indexOf('$super') > 0;
	function usesSuper(obj) {
		return !probe_super || /\B\$super\b/.test(obj.toString());
	}

	/* helper function to set the attribute of something to a value or
	 removes it if the value is undefined. */
	function setOrUnset(obj, key, value) {
		if (value === undefined)
			delete obj[key];
		else
			obj[key] = value;
	}

	/* gets the own property of an object */
	function getOwnProperty(obj, name) {
		return Object.prototype.hasOwnProperty.call(obj, name)
			? obj[name] : undefined;
	}

	/* instantiate a class without calling the constructor */
	function cheapNew(cls) {
		disable_constructor = true;
		var rv = new cls;
		disable_constructor = false;
		return rv;
	}

	/* the base class we export */
	var Class = function() {};

	/* restore the global Class name and pass it to a function.  This allows
	 different versions of the classy library to be used side by side and
	 in combination with other libraries. */
	Class.$noConflict = function() {
		try {
			setOrUnset(root, 'Class', old_class);
		}
		catch (e) {
			// fix for IE that does not support delete on window
			root.Class = old_class;
		}
		return Class;
	};

	/* what version of classy are we using? */
	Class.$classyVersion = CLASSY_VERSION;

	/* extend functionality */
	Class.$extend = function(properties) {
		var super_prototype = this.prototype;

		/* disable constructors and instantiate prototype.  Because the
		 prototype can't raise an exception when created, we are safe
		 without a try/finally here. */
		var prototype = cheapNew(this);

		/* copy all properties of the includes over if there are any */
		if (properties.__include__)
			for (var i = 0, n = properties.__include__.length; i != n; ++i) {
				var mixin = properties.__include__[i];
				for (var name in mixin) {
					var value = getOwnProperty(mixin, name);
					if (value !== undefined)
						prototype[name] = mixin[name];
				}
			}

		/* copy class vars from the superclass */
		properties.__classvars__ = properties.__classvars__ || {};
		if (prototype.__classvars__)
			for (var key in prototype.__classvars__)
				if (!properties.__classvars__[key]) {
					var value = getOwnProperty(prototype.__classvars__, key);
					properties.__classvars__[key] = value;
				}

		/* copy all properties over to the new prototype */
		for (var name in properties) {
			var value = getOwnProperty(properties, name);
			if (name === '__include__' ||
				value === undefined)
				continue;

			prototype[name] = typeof value === 'function' && usesSuper(value) ?
				(function(meth, name) {
					return function() {
						var old_super = getOwnProperty(this, '$super');
						this.$super = super_prototype[name];
						try {
							return meth.apply(this, arguments);
						}
						finally {
							setOrUnset(this, '$super', old_super);
						}
					};
				})(value, name) : value
		}

		/* dummy constructor */
		var rv = function() {
			if (disable_constructor)
				return;
			var proper_this = root === this ? cheapNew(arguments.callee) : this;
			if (proper_this.__init__)
				proper_this.__init__.apply(proper_this, arguments);
			proper_this.$class = rv;
			return proper_this;
		}

		/* copy all class vars over of any */
		for (var key in properties.__classvars__) {
			var value = getOwnProperty(properties.__classvars__, key);
			if (value !== undefined)
				rv[key] = value;
		}

		/* copy prototype and constructor over, reattach $extend and
		 return the class */
		rv.prototype = prototype;
		rv.constructor = rv;
		rv.$extend = Class.$extend;
		rv.$withData = Class.$withData;
		return rv;
	};

	/* instanciate with data functionality */
	Class.$withData = function(data) {
		var rv = cheapNew(this);
		for (var key in data) {
			var value = getOwnProperty(data, key);
			if (value !== undefined)
				rv[key] = value;
		}
		return rv;
	};

	/* export the class */
	root.Class = Class;
})();
/* stringhelpers.js
 *
 * Generic string manipulation functions useful for CommandFusion iViewer integrators
 * Public domain code, written by CommandFusion Pty. Ltd - www.commandfusion.com
 *
 * Functions:
 *
 * padBeginning(total, fillChar, string): pad the beginning of a string
 * padEnd(total, fillChar, string): pad the end of a string
 * hex2number(string): read a value encoded as a hex-ascii string (i.e. "3a8b7d")
 * number2hex(string,digits): turn a number into its hex-ascii representation. Specify the number of digits to pad the output
 *
 */

// a helper cache to avoid allocating padding strings all the time
var PAD_CACHE = {};

// Fill the beginning of a string so that the resulting string is
// exactly the requested `len'. If it's shorter, we prepend `fill'
// as many times as requested. If longer, we truncate the beginning
// of the string. Note that for this to work as expected, `fill' has
// to be a one-character string
//
// Example:
// padBeginning(6,"0","7a8") will return "0007a8"
// padBeginning(4,"0","Hello") will return "ello" (truncate front)
// padBeginning(6,"-","") will return "------"
// etc.
function padBeginning(len, fill, str) {
	var l = str.length;
	if (l < len) {
		if (!PAD_CACHE.hasOwnProperty(fill)) {
			PAD_CACHE[fill]={};
		}
		return (PAD_CACHE[fill][len-l] || (PAD_CACHE[fill][len-l]=(new Array(len-l+1).join(fill)))) + str;
	}
	return (l === len) ? str : str.substring(l-len);
}

// Fill the end of a string so that the resulting string is
// exactly the requested `len'. If it's shorter, we prepend `fill'
// as many times as requested. If longer, we truncate the end
// of the string. Note that for this to work as expected, `fill' has
// to be a one-character string
//
// Example:
// padEnd(6,"0","7a8") will return "7a8000"
// padEnd(4,"0","Hello") will return "Hell" (truncate end)
// padEnd(6,"-","") will return "------"
// etc.
function padEnd(len, fill, str) {
	var l = str.length;
	if (l < len) {
		if (!PAD_CACHE.hasOwnProperty(fill)) {
			PAD_CACHE[fill]={};
		}
		return str + (PAD_CACHE[fill][len-l] || (PAD_CACHE[fill][len-l]=(new Array(len-l+1).join(fill))));
	}
	return (l === len) ? str : str.substring(0,len);
}

// Convert a string to a number value
// This is trivial, but we often see people write complicated conversion routines,
// so this is more like a reminder for efficient practices
function hex2number(str) {
	return parseInt(str, 16);
}

// Convert a number value to a hex string
// This is trivial, but we often see people write complicated conversion routines,
// so this is more like a reminder for efficient practices. For all-uppercase strings,
// call the uppercase() on the result: number2hex(234234).toUpperCase() -> "392FA"
// Examples:
// number2hex(234234) -> "392fa"
// number2hex(234234,10) -> "00000392fa"
function number2hex(value,digits) {
	return padBeginning(digits, "0", value.toString(16));
}

// Generate a random string
function randomString() {
	return Math.floor((1 + Math.random()) * 0x100000000)
		.toString(16)
		.substring(1);
}


/* tests
 console.log(padBeginning(6,"-",""));
 console.log(padBeginning(8,"0","34234"))
 console.log(padBeginning(4,"0","hello"))

 console.log(padEnd(6,"-",""));
 console.log(padEnd(8,"0","34234"))
 console.log(padEnd(4,"0","hello"))

 console.log(number2hex(234234));
 console.log(number2hex(234234).toUpperCase());
 console.log(number2hex(234234,10));
 */
/**
 * The CFLink namespace provides access to classes and methods related to CommandFusion's CFLink bus devices.
 * It encapsulates all the classes, functions and definitions you need to work with CommandFusion hardware devices.
 *
 * <br><br>
 * If you are looking for a starting point, you can obtain JavaScript objects to communicate with devices on the CFLink bus
 * via the {@link CFLink.getDevices} and {@link CFLink.getDevice} functions.
 *
 * @namespace CFLink
 */
var CFLink = {
	baseReplyRegex: /\xF2([\s\S])\xF3(R)(\w{3})(\w{3})\xF4([\s\S]*)\xF5\xF5/, // Capture groups: ID, Device, Command, Data
	baseCFLinkRegex: /\xF2([\s\S])\xF3([QCTR])(\w{3})(\w{3})\xF4([\s\S]*)\xF5\xF5/, // Capture groups: ID, Command Type, Device, Command, Data
	replyCallback: null,

	//discoverySystemName: "CFLINK_DISCOVERY",	// System used for discovery only
	//directSystemName: "CFLINK",				// System for direct comms (after selecting ethernet device)
	systemName: "CFLINK",						// The system name we are currently using

	/** @private */
	callbackAttachments: {},
	/** @private */
	eventWatchers: {},
	/** @private */
	nextWatcherID: 1,
	/**
	 * A unique identifier we use to assign to each device, module and port object that we create
	 * for the sole purpose of recognizing objects in the hash for event watching / firing
	 * @private
	 */
	nextUniqueID: 1,

	/**
	 * A function you can set that intercepts all inbound and outbound CFLink messages
	 * (ie to log traffic). Your function should be: function(incoming,systemName,data)
	 * where `incoming' is true for received data and false for sent data, systemName is
	 * the name of the external system defined in iViewer, and data is the raw data received.
	 * You can further parse the data using {@link CFLink.baseCFLinkRegex} for your
	 * display purposes
	 * @function
	 */
	interceptNetworkDialog: null,

	/**
	 * A function that will be called when a new device is discovered.
	 * Your function should be: function(systemName, cflinkID, deviceModel)
	 * where `systemName' is the system the device was found in, `cflinkID' is the
	 * CFLink ID of the device and `deviceModel' is the model name of the device.
	 * @function
	 */
	deviceDiscovered: null,

	/**
	 * Constants for known CommandFusion hardware models (devices and modules)
	 * @enum
	 */
	model: {
		/**
		 * a CommandFusion LANBridge device
		 * @constant
		 */
		LANBridge: "LANBridge",
		/**
		 * a CommandFusion DIN-MOD4 device
		 * @constant
		 */
		DINMOD4: "DIN-MOD4",
		/**
		 * a CommandFusion MOD4 device
		 * @constant
		 */
		MOD4: "MOD4",
		/**
		 * a CommandFusion CFMini device
		 * @constant
		 */
		CFMini: "CFMini",
		/**
		 * a CommandFusion SW16 device
		 * @constant
		 */
		SW16: "SW16",
		/**
		 * a CommandFusion IRBlaster device
		 * @constant
		 */
		IRBlaster: "IRBlaster",
		/**
		 * HRY2 module: 2 x 250VAC 15A latching (polarized) relays
		 * @constant
		 */
		HRY2: "MOD-HRY2",
		/**
		 * RY4 module: 4 x 250VAC 5A non-latching normally-open relays
		 * @constant
		 */
		RY4: "MOD-RY4",
		/**
		 * LRY8: 8 x 30VDC 1A latching (polarized) relays
		 * @constant
		 */
		LRY8: "MOD-LRY8",
		/**
		 * SSRY4: 4 x 250VAC 2A non-latching normally-open solid-state relays
		 * @constant
		 */
		SSRY4: "MOD-SSRY4",
		/**
		 * IO8: 8 x configurable I/O - dry contact, voltage reading, resistance reading, LED output, video sensing, voltrage trigger
		 * @constant
		 */
		IO8: "MOD-IO8",
		/**
		 * IR8: 8 x IR outputs
		 * @constant
		 */
		IR8: "MOD-IR8",
		/**
		 * COM4: 2-4 x configurable RS232/422/485 bi-directional serial ports
		 * @constant
		 */
		COM4: "MOD-COM4",
		/**
		 * a CommandFusion CF Solo device
		 * @constant
		 */
		CFSolo: "CFSOLO"
	},

	/**
	 * Get the next unique ID to assign to a new object
	 * @private
	 */
	getNextUniqueID: function() {
		return this.nextUniqueID++;
	},

	/**
	 * Obtain a number of CFLink devices. On input, pass an object whose properties are names for devices,
	 * and values are objects defining the type of device to control. Each device will be added to our
	 * registry (no discovery needed) and on return, an object mapping names and JavaScript objects (CFLinkDevice instances)
	 * will be returned.
	 *
	 * The object describing each device should have at least two properies: an `id' property (String) that is the CFLink
	 * ID of the devce, and a `type' property that is the {@link CFLink.model} of the device. When obtaining a DIN-MOD4 or
	 * MOD4 device, you can optionally specify the list of modules that are currently inserted in the device, so as to
	 * being able to access the modules right away without having to wait for the device information to come back on the
	 * CFLink bus (every time you obtain a device that has not been previously obtained, a query is sent on the CFLink bus
	 * to obtain configuration information about the device).
	 *
	 * @param {object} devices
	 * @return {object}
	 *
	 * @example
	 * var devices = CFLink.getDevices({
	 *   mini1: {
	 *     id: "04",
	 *     type: CFLink.model.CFMini
	 *   },
	 *   mini2: {
	 *     id: "05",
	 *     type: CFLink.model.CFMini
	 *   },
	 *   keypad: {
	 *     id: "3E",
	 *     type: CFLink.model.SW16
	 *   },
	 *   bay: {
	 *     id: "2B",
	 *     type: CFLink.model.DINMOD4,
	 *     // array of modules in slots 1, 2, 3, 4. null if no module present.
	 *     modules: [ CFLink.model.IO8, CFLink.model.SSRY4, CFLink.model.HRY2, null ]
	 *   }
	 * }, "CFLINK_SYSTEM");
	 *
	 * // now we can talk to the devices
	 *
	 * // pulse relay #3 for 0.5 second
	 * devices.mini1.pulseRelayState(3, 5);
	 *
	 * // blink keypad digits (LEDs 0 to 9)
	 * var digits = [0,1,2,3,4,5,6,7,8,9];
	 * devices.keypad.blinkLED(digits, 0, 100, 5, 3, 0);
	 *
	 * // be notified of digit presses
	 * devices.keypad.watchContacts(digits, function(keypad, digit, state) {
	 *   // we are called when one of the digits 0-9 is pressed,
	 *   //	and again when it is released
	 *   if (state == 1) {
	 *     CF.log("Keypad digit " + digit + " was pressed");
	 *   } else {
	 *     CF.log("Keypad digit " + digit + " was released");
	 *   }
	 * });
	 *
	 */
	getDevices: function(devices, systemName) {
		var ret = {};
		var dev, def, type, name, id;
		for (name in devices) {
			if (devices.hasOwnProperty(name) && typeof(name)==="string") {
				def = devices[name];
				if (def.hasOwnProperty("id") && def.hasOwnProperty("type")) {
					dev = this._createDevice(def.id, def.type, systemName, def["modules"]);
					if (dev != null) {
						ret[name] = dev;
					}
				}
			}
		}
		return ret;
	},

	/**
	 * Create a new device according to the specified definition
	 * @param {String} id the CFLink ID of the device to create, as hex-ascii string (2 chars)
	 * @param {CFLink.model} type the type of device to create (i.e. {@link CFLink.model.CFMini})
	 * @param {String} systemName the name of the external system (defined in the GUI) we are using to talk to this device. System talks to a LAN Bridge that bridges the ethernet and CFLink networks
	 * @private
	 */
	_createDevice: function(id, type, systemName, WHOdata, doNotQueryAfterCreation) {
		switch (type) {
			case CFLink.model.LANBridge:
				return new CFLink.LANBridge(systemName, id, WHOdata, doNotQueryAfterCreation);

			case CFLink.model.CFMini:
				return new CFLink.CFMini(systemName, id, WHOdata);

			case CFLink.model.SW16:
				return new CFLink.SW16(systemName, id, WHOdata);

			case CFLink.model.DINMOD4:
				// check whether there is an array that contains a list of modules
				if (arguments.length > 3 && arguments[3] instanceof Array) {
					var modulesList = arguments[3];
					if (modulesList.length === 4) {
						var s = "DIN-MOD4:::,";
						for (var i=1; i <= 4; i++) {
							s += "M" + i + ":" + modulesList[i-1] + (i === 4 ? "" : ",");
						}
					}
					CF.log("Creating DIN-MOD4 with premade module list: " + s);
					return new CFLink.DINMOD4(systemName, id, s);
				}
				return new CFLink.DINMOD4(systemName, id, WHOdata);
			case CFLink.model.MOD4:
				// check whether there is an array that contains a list of modules
				if (arguments.length > 3 && arguments[3] instanceof Array) {
					var modulesList = arguments[3];
					if (modulesList.length === 4) {
						var s = "MOD4:::,";
						for (var i=1; i <= 4; i++) {
							s += "M" + i + ":" + modulesList[i-1] + (i === 4 ? "" : ",");
						}
					}
					CF.log("Creating MOD4 with premade module list: " + s);
					return new CFLink.DINMOD4(systemName, id, s);
				}
				return new CFLink.DINMOD4(systemName, id, WHOdata);
			case CFLink.model.IRBlaster:
				return new CFLink.IRBlaster(systemName, id, WHOdata);
			case CFLink.model.CFSolo:
				return new CFLink.CFSolo(systemName, id, WHOdata);
			default:
				CF.log("UNKNOWN DEVICE ATTEMPTED TO BE CREATED: " + type);
		}
		return null;
	},

	/**
	 * A registry of CFLink devices. Each key is the device serial number.
	 * Individual modules (modules for DIN-MOD4 and MOD4) are not listed in this registry.
	 *
	 * Keys in this registry are device serial numbers. For topology discovery, you can check the
	 * cflinkNetworks property which allows you to determine on which CFLink network a device is connected
	 * (for example, there may be several LANBridge devices providing multiple network accesses to the
	 * same group of interconnected CFLink devices, but there can be several such groups not interconnected,
	 * and with CFLink device IDs overlapping those on the other network)
	 */
	deviceRegistry: {},

	/**
	 * Call this method at the beginning of the discovery process, or when starting
	 * a new discovery. Note that as soon as you have called this methods, all objects
	 * that were in use from a previous discovery will stop having their data callbacks
	 * called, as we remove them from our attachment list. If you need to keep these
	 * objects around for any reason, make sure you make a copy of the deviceRegistry
	 * first.
	 */
	initializeDeviceRegistry: function() {
		this.deviceRegistry = {};
		this.callbackAttachments = {};
	},

	/**
	 * Add a device to the device registry, if it wasn't already in it. It may already be there
	 * if there are several LANBridge devices on the same network and we perform the discovery
	 * process on all of them. This method is also internally used when creating devices manually
	 * from a predefined list.
	 * @param {CFLink.Device} device the device object to add to the registry
	 * @returns {Boolean} true if the device was added to the list, false if it was already in it
	 */
	addDeviceToRegistry: function(device) {
		if (CF.debug) {
			CF.log("Added CFLink device " + device.serialNum + " ( " + device.model + " firmware v" + device.firmwareVer + ")");
		}
		if (this.deviceRegistry[device.serialNum] != null) {
			// this device was already in the registry
			if (CF.debug) { CF.log("-> this device was already in our registry, removing..."); }
			this.removeCallbacksByDevice(device);
			return false;
		}
		this.deviceRegistry[device.serialNum] = device;
		return true;
	},

	/**
	 * Obtain the JavaScript object representing a CFLink device. We identify the device by its
	 * model (i.e. {@link CFLink.model.CFMini}), CFLink ID and name of network system iViewer uses to send its messages.
	 * If the device does not exist yet (has not been discovered by automatic discovery, or has never been used), its object
	 * is created, added to the registry and will remain there for as long as {@link CFLink.initializeDeviceRegistry} is not called.
	 * @param {String} systemName	name of the iViewer network system we use to send CFLink messages (to a LANBridge on the same CFLink bus as the target device)
	 * @param {String} deviceModel	model of the device
	 * @param {String} cflinkID		the CFLink device ID ("02" to "FE")
	 * @param {String} WHOdata 		the WHO reply data, separated by colons
	 * @param {String} serialNum	the serial number of the device
	 * @param {Array} modules this parameter is optional. When creating a MOD4 or DIN-MOD4 you can specify which modules are present. See {@link CFLink.getDevices} function for an example.
	 */
	getDevice: function(systemName, deviceModel, cflinkID, WHOdata, serialNum) {
		// lookup existing devices in registry
		var dev, registry = this.deviceRegistry, ident = systemName + "." + deviceModel + "." + cflinkID;
		// Only look for existing device if the serial num is not bogus
		if (serialNum != "00000000" && serialNum != "FFFFFFFF") {
			if (registry.hasOwnProperty(serialNum)) {
				return registry[serialNum];
			}
//		} else {
//			// Invalid serial, so lets check if the cflink ID exists
//			var matchingDevice = this.getDeviceByCFLinkID(cflinkID);
//			if (matchingDevice) {
//				return matchingDevice;
//			}
		}
		/*for (var sn in registry) {
			if (registry.hasOwnProperty(sn)) {
				dev = registry[sn];
				if (dev.systemName === systemName && dev.cflinkID === cflinkID) {
					return dev;
				}
			}
		}
		*/

		// device was not found, create a new one
		dev = this._createDevice(cflinkID, deviceModel, systemName, WHOdata);
		if (dev != null) {
			registry[dev.serialNum] = dev;	// add to registry using simple identity
			if (this.deviceDiscovered) {
				this.deviceDiscovered(systemName, dev);
			}
		}
		return dev;
	},

	/**
	 * Obtain the JS object representing a CFLink device, based on its serial number
	 * @param {string} serialNumber the CF device serial number
	 * @return {CFLink.Device} the CFLink.Device object
	 */
	getDeviceBySerialNumber: function(serialNumber) {
		return this.deviceRegistry[serialNumber];
	},

	/**
	 * Obtain the CFLink.Device object, based on its CFLink ID
	 * @param {string} cflinkID the CFLink ID
	 * @return {@link CFLink.Device} the CFLink.Device object
	 */
	getDeviceByCFLinkID: function(cflinkID) {
		for (var sn in this.deviceRegistry) {
			if (this.deviceRegistry.hasOwnProperty(sn)) {
				var dev = this.deviceRegistry[sn];
				if (dev.hasOwnProperty("cflinkID") && dev.cflinkID == cflinkID) {
					return dev;
				}
			}
		}
		return null;
	},

	/**
	 * Obtain the CFLink.Device object that contains the module that itself
	 * contains the given port object
	 * @param {CFLink.Module} moduleObject the JavaScript object representing this module
	 * @return a {@link CFLink.Device} object (typically a {@link CFLink.DINMOD4} object)
	 */
	getDeviceForModule: function(moduleObject) {
		for (var sn in this.deviceRegistry) {
			if (this.deviceRegistry.hasOwnProperty(sn)) {
				var dev = this.deviceRegistry[sn];
				if (dev.hasOwnProperty("modules") && dev.modules.indexOf(moduleObject) != -1) {
					return dev;
				}
			}
		}
		return null;
	},

	/**
	 * Obtain the CFLink.Device object that contains the module that itself
	 * contains the given port object
	 * @param {CFLink.IOPort} portObject the JavaScript object for the port (i.e. a {@link CFLink.IOPort} object, etc).
	 */
	getDeviceForModulePort: function(portObject) {
		for (var sn in this.deviceRegistry) {
			if (this.deviceRegistry.hasOwnProperty(sn)) {
				var dev = this.deviceRegistry[sn];
				if (dev.hasOwnProperty("modules")) {
					var modules = dev.modules;
					var i, n = modules.length;
					for (i = 0; i < n; i++) {
						if (modules[i] && modules[i].ownsPort(portObject)) {
							return dev;
						}
					}
				}
			}
		}
		return null;
	},

	startDiscovery: function(system) {
		if (system) {
			CFLink.systemName = system;
		}
		CFLink.buildMsg(CFLink.systemName, "FF", "Q", null, "WHO");
		setTimeout(function(me) {CFLink.buildMsg(CFLink.systemName, "FF", "Q", null, "WHO");}, 1000, this);
		setTimeout(function(me) {CFLink.buildMsg(CFLink.systemName, "FF", "Q", null, "WHO");}, 2000, this);
	},

	/**
	 * Call this function when the discovery is complete, so as to prepare the
	 * network registry based on the data gathered and effectively generate a view
	 * of the network topology
	 */
	buildNetworkRegistry: function() {
		// TODO
	},

	// -------------------------------------------------------------------------------------------------------
	// CFLink bus messages management
	// -------------------------------------------------------------------------------------------------------

	/**
	 * Process incoming data forwarded to us by a LANBridge or serial unit. Check if this
	 * is a valid CFLink packet (should be), then parse and internally route the
	 * packet through our stack. We are being called by iViewer, so receiving the
	 * iViewer name of the feedback item through which we receive the data.
	 * @param {String} feedbackName	The name of the feedback item the data was matched from
	 * @param {String} data			the data to process
	 * @private
	 */
	incomingData: function (feedbackName, data) {
		// Quick check for match of base reply
		if (data.length < 12 || data.charCodeAt(0) !== 0xF2 || data.charCodeAt(2) !== 0xF3) {
			// invalid CFLink packet
			if (CF.debug) { CF.log("invalid CFLink packet: " + data); }
			return;
		}
		if (CFLink.interceptNetworkDialog != null) {
			CFLink.interceptNetworkDialog(true, CFLink.systemName, data);
		}
		if (data.charAt(3) === 'R') {
			var matches = CFLink.baseReplyRegex.exec(data);
			if (matches) {
				// Look for WHO replies, with data
				if (matches[4] == "WHO" && matches[5]) {
					// Get the device, which creates it if not already existing
					var config = matches[5].split(':');
					// model = config[0], serial = config[1], firmwareVer = config[2], protocolVer = config[3]
					CFLink.getDevice(CFLink.systemName, config[0], ("0"+matches[1].charCodeAt(0).toString(16)).slice(-2).toUpperCase(), matches[5], config[1]);
				}
				if (CFLink.replyCallback !== null) {
					// ID, Device, Command, Data
					CFLink.replyCallback(matches[1], matches[3], matches[4], matches[5]);
				}
			}
		}

		// Check all attached callbacks to see if they are wanting the data
		var attachments = CFLink.callbackAttachments;
		for (var i in attachments) {
			if (attachments.hasOwnProperty(i)) {
				// Ensure the object is not undefined
				var att = attachments[i];
				if (att !== undefined) {
					// Check for a regex match, then call the callback if successful
					if (att.regex.test(data)) {
						//CF.log("Calling Back attached listener for: " + data)
						att.callback(CFLink.baseCFLinkRegex.exec(data), att.regex, att.me);
					}
				}
			}
		}
	},

	/**
	 * Build a valid CFLink packet and optionally send it.
	 *
	 * @param {String} systemName	name of the remote system (in iViewer GUI) to send the command to. Pass null to not send the command right away (simply return the assembled packet)
	 * @param {String} cflinkID		ID of device to talk to ("02" to "EF", "FF" for broadcast)
	 * @param {String} commandType	type of command to send: "Q"=query, "C"=configure, "T"=transmit
	 * @param {String} target		the 3-char name of the target (i.e. "LAN", "IOX" for I/O module, etc)
	 * @param {String} command		the 3-char name of the command
	 * @param {String} payload		the command data payload
	 * @return {String} the complete constructed CFLink packet
	 */
	buildMsg: function (systemName, cflinkID, commandType, target, command, payload) {
		if (CF.debug && !this._buildMsgChecks(systemName, cflinkID, commandType, target, command)) {
			return "";
		}
		var msg = "\xF2" + String.fromCharCode(parseInt(cflinkID, 16)) + "\xF3" + commandType + (target || 'CFX') + command + "\xF4" + (payload || '') + "\xF5\xF5";
		if (systemName != null) {
			CF.send(systemName, msg);
			if (CFLink.interceptNetworkDialog != null) {
				CFLink.interceptNetworkDialog(false, systemName, msg);
			}
		}
		return msg;
	},

	/**
	 * Sanity checks method used internally only when debugging
	 * @param {String} systemName
	 * @param {String} cflinkID
	 * @param {String} commandType
	 * @param {String} target
	 * @param {String} command
	 * @return {Boolean} false if one of the parameters is invalid
	 * @private
	 */
	_buildMsgChecks: function(systemName, cflinkID, commandType, target, command) {
		// sanity checks
		if (typeof(systemName) !== "string") {
			CF.log("CFLink.buildMsg: invalid system name. Expected a string, got: " + systemName);
			return false;
		}
		if (typeof(commandType) !== "string" || commandType.length !== 1) {
			CF.log("CFLink.buildMsg: invalid command type. Expected a single character string, got: " + commandType);
			return false;
		}
		if ((target !== null && typeof(target) !== "string") || (target !== null && target.length !== 3)) {
			CF.log("CFLink.buildMsg: invalid command target. Expected a 3-character string, got: " + target);
			return false;
		}
		if (typeof(command) !== "string" || command.length !== 3) {
			CF.log("CFLink.buildMsg: invalid command. Expected a 3-character string, got: " + command);
			return false;
		}
		return true;
	},

	// -------------------------------------------------------------------------------------------------------
	// Callbacks management
	// -------------------------------------------------------------------------------------------------------

	/**
	 * Attach a new callback for replies based on regex match from device ID
	 * @param {String} id The ID of the target device ('02' - 'EF', 'FF')
	 * @param {Function} callback The function to call when the regex matches
	 * @param {Object} me the object to set as `this' when your callback function is executed
	 */
	attachReplyCallbackByCFLinkID: function (id, callback, me) {
		this.callbackAttachments[id] = {regex: new RegExp("^\\xF2\\x"+id+"\\xF3R"), callback: callback, me: me};
	},

	/**
	 * Attach a new callback for replies based on regex match of a specific command type
	 * @param {String} command the command to craft the regex for (i.e. "TRLYSET")
	 * @param {Function} callback a function to call when the regex is matched
	 * @param {Object} me the object to set as `this' when your callback function is called.
	 */
	attachReplyCallbackByCommand: function (command, callback, me) {
		this.callbackAttachments[command] = {regex: new RegExp('\\xF3'+command+'\\xF4'), callback: callback, me: me};
	},

	/**
	 * Remove an attached callback based on its CFLink ID
	 * @param {String} id The ID of the target device ('02' - 'EF', 'FF')
	 */
	removeCallbackByCFLinkID: function (id) {
		delete this.callbackAttachments[id];
	},

	/**
	 * Remove an attached callback based on its Command
	 * @param {String} command The Command to remove the callback for
	 */
	removeCallbackByCommand: function (command) {
		delete this.callbackAttachments[command];
	},

	/**
	 * Remove all callbacks for a specific device
	 * @param {CFLink.Device} device
	 */
	removeCallbacksByDevice: function(device) {
		var attachments = this.callbackAttachments;
		for (var att in attachments) {
			// remove this device from the callback registry
			// to which most devices attach at init time - if a device is discovered twice, it is
			// important that we remove it from all our arrays so as not to keep any reference to it.
			if (attachments.hasOwnProperty(att) && attachments[att].me === device) {
				delete attachments[att];
			}
		}
	},

	// -------------------------------------------------------------------------------------------------------
	// Event watching and firing
	// -------------------------------------------------------------------------------------------------------

	/**
	 * Start watching events emitted by CFLink devices.
	 *
	 * The order in which registered objects will receive a fire notification through their registered callback is the following:
	 * First, those watching a specific CFLink object will receive the notification, in the order their registered.
	 * Second, those watching any CFLink object (registered using a null sender object) will receive the notification, in the order their registered.
	 *
	 * @param {String} event		the event to watch (i.e. {@link CFLink.SW16.DRY_CONTACT_CHANGE})
	 * @param {Object} sender	filter on events from a specific CFLink object. Pass null to watch the same event emitted by all CFLink objects
	 * @param {Function} callback	your callback function. Parameters are specific to each event, the first two parameters are always the CFLink object and the event name
	 * @param {Object} me		the object to set as the 'this' object when calling your callback function
	 * @return {Number} an event watcher ID you can use to stop watching this event by calling {@link CFLink.unwatch()}
	 */
	watch: function (event, sender, callback, me) {
		if (this.eventWatchers[event] === undefined) {
			this.eventWatchers[event] = {};
		}
		// we are generating unique IDs on demand, when needed and only for the objects we want
		// to disambiguate during event watching.
		var uid;
		if (sender == null) {
			uid = "all";
		} else {
			uid = sender._$cflinkUID;
			if (uid == undefined) {
				uid = "cflinkUID." + this.getNextUniqueID();
				sender._$cflinkUID = uid;
			}
		}
		var w = this.eventWatchers[event];
		if (w[uid] === undefined) {
			w[uid] = [];
		}
		w[uid].push({
			callback: callback,
			me: me,
			id: this.nextWatcherID
		});
		return this.nextWatcherID++;
	},

	/**
	 * Stop watching a CFLink event. Use the watcherID returned by {@link CFLink.watch()} to identify
	 * the event watcher to remove
	 * @param {Number} watcherID	the watcher ID originally returned by {@link CFLink.watch()}.
	 */
	unwatch: function (watcherID) {
		for (var evt in this.eventWatchers) {
			if (this.eventWatchers.hasOwnProperty(evt)) {
				var w = this.eventWatchers[evt];
				for (var sender in w) {
					if (w.hasOwnProperty(sender)) {
						var array = w[sender], i, n = array.length;
						for (i=0; i<n; i++) {
							if (array[i].id === watcherID) {
								array.splice(i,1);
								return;
							}
						}
					}
				}
			}
		}
	},

	/**
	 * Internal function which fires a CFLink event and call all the registered watchers for this event.
	 * @param {String} event	the event name (i.e. {@link CFLink.SW16.DRY_CONTACT_CHANGE})
	 * @param {Object} sender	the CFLink object that sends this event (could be a {@link CFLink.Device} or a {@link CFLink.Module} object
	 * @param {Array} params	the event parameters list (CFLink object and event name will be prepended to this parameter list)
	 * @private
	 */
	fire: function(event, sender, params) {
		var w = this.eventWatchers[event];
		if (w !== undefined) {
			var uid;
			if (sender == null) {
				uid = undefined;
			} else {
				uid = sender._$cflinkUID;
			}
			var i, n, cbParams, a;
			if (uid !== undefined) {
				// first fire to specific object watchers
				a = w[uid];
				if (a !== undefined) {
					for (i = 0, n = a.length; i < n; i++) {
						if (cbParams === undefined) {
							cbParams = [event, sender];
							cbParams.push.apply(cbParams, params);
						}
						a[i].callback.apply(a[i].me, cbParams);
					}
				}
			}
			// next fire to generic object watchers
			a = w["all"];
			if (a !== undefined) {
				for (i = 0, n = a.length; i < n; i++) {
					if (cbParams === undefined) {
						cbParams = [event, sender];
						cbParams.push.apply(cbParams, params);
					}
					a[i].callback.apply(a[i].me, cbParams);
				}
			}
		}
	}

	// The comment below is for automatically inserting the CFLink simple interface code during the build process
	// $INSERT_CFLINK_SIMPLE_INTERFACE$
};
CFLink.Device = Class.$extend(
	/**
	 * @lends CFLink.Device.prototype
	 */
	{
		/**
		 * This is the base class for all CFLink device objects. Subclasses do implement the actual
		 * device functionality (i.e. LANBridge, MOD4, SW16, etc). This class provides the base support
		 * and functionality for subclasses, like access to onboard COM ports for devices that have one
		 * (LAN Bridge, CFMini, DIN-MOD4) and support for sending CFLink-formatted messages.
		 *
		 * To obtain an object representing one of the devices on your CFLink bus,
		 * use the {@link CFLink.getDevice} function.
		 *
		 * @protected
		 * @constructs
		 * @summary Base class for other device objects
		 * @example
		 *
		 * // Obtain a DIN-MOD4 object to access it via JavaScript. This assumes that your
		 * // GUI is configured with an external TCP system named "CFLINK" that connects to
		 * // a LAN Bridge (for example on the default port 10207)
		 * // The DIN-MOD4 we want to access has CFLink ID 11
		 *
		 * var dm4 = CFLink.getDevice("CFLINK", CFLink.model.DINMOD4, "11");
		 *
		 *
		 *
		 */
		__init__:function (systemName, modelName, cmd, cflinkID, serial, firmware, cflinkVer) {
			this.rs232Port = null;
			this.systemName = systemName;
			this.model = modelName;
			this.commandPrefix = cmd;
			this.cflinkID = cflinkID; // {String} The ID of the device ('02' - 'EF')
			if (serial == "00000000" || serial == "FFFFFFFF") {
				// Bogus serial number detected, most likely prototype unit...
				serial = randomString();
				CF.log("Prototype Unit Found: " + serial);
			}
			this.serialNum = serial;
			this.firmwareVer = firmware;
			this.protocolVer = cflinkVer;
		},

		/** @private */
		__del__:function () {
			// When we deconstruct a device, stop watching any reply data associated with its ID
			CFLink.removeCallbackByCFLinkID(this.cflinkID);
		},

		/**
		 * Send a CFLink packet to the CFLink device this object represents
		 * @param {String} commandType the command type (i.e. 'Q', 'T', etc)
		 * @param {String} command the command (i.e. "SET")
		 * @param {String} payload the actual payload of the CFLink packet
		 * @param {String} optional command target to use instead of the models target name
		 */
		send:function (commandType, command, payload, target) {
			if (commandType === "Q" && command === "WHO") {
				CFLink.buildMsg(this.systemName, this.cflinkID, "Q", "CFX", "WHO", payload);
			} else {
				CFLink.buildMsg(this.systemName, this.cflinkID, commandType, target || this.commandPrefix, command, payload);
			}
		},

		/**
		 * @returns {String} cleaned-up model name
		 * @private
		 */
		getCleanedModelName:function () {
			return this.model.replace(/[-\s]/, "");
		},

		/**
		 * Send a query to the device to obtain its configuration. Subclasses must override
		 * this method to send the queries appropriate for each device
		 * @private
		 */
		queryConfig:function () {
			// Override this function in each device subclass
		},

		/**
		 * Resets the device, this will also apply some configuration changes for some devices like LANBridge
		 */
		rebootDevice:function () {
			this.send("T", "RST", "");
		},

		/**
		 * Get the CFLink ID of the device in padded uppercase format.
		 */
		getCFLinkID:function () {
			return ("00"+this.cflinkID).slice(-2).toUpperCase();
		},

		/**
		 * Change the CFLink ID of the device.
		 * @param {string} id    CFLink ID of the device in ascii format ('02' - 'EF')
		 */
		setCFLinkID:function (id) {
			if (id != this.cflinkID) {
				this.cflinkID = id;
				var data = id.toUpperCase();
				if (this.serialNum != null) {
					data += ":" + this.serialNum;
				}

				// Listen for replies on the new device ID
				CFLink.attachReplyCallbackByCFLinkID(id, this.replyData, this);

				// Old reply callback listener will be removed once DID reply is received to confirm device ID change
				this.send("C", "DID", data);
			}
		},

		//
		// COM port commands
		//

		/**
		 * Send data to the device's onboard COM port if it has one (i.e. CFMini, LAN Bridge, DIN-MOD4)
		 * @param data		the data to send. Data is being sent verbatim. You can pass a string, or an array of character codes
		 * 					(if you pass an array, the software assumes these are character codes, and will turn each code into a byte)
		 */
		sendCOMData : function(data) {
			if (this.rs232Port != null) {
				if (data instanceof Array) {
					data = String.fromCharCode.apply(null, data);
				}
				this.send("T", "SPW", this.rs232Port.sendDataCommand(data));
			}
		},

		/**
		 * Setup a callback function that will be called whenever data is received on the device's onboard COM port
		 * Having multiple callback monitoring the onboard COM port is allowed.
		 *
		 * Your callback function should be of the form:
		 *
		 * myCallback(deviceObject, data)
		 *
		 * Where `deviceObject' is the {@link CFLink.Device} device object (for example a {@link CFLink.CFMini} object),
		 * and `data' is the received data (a String that may contain binary characters, as all received data is passed verbatim to you).
		 *
		 * @param {Function} callback    your callback function, of the form myCallback(deviceObject, data)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {Number} a watcherID you can use to unwatch with {@link CFLink.Device.unwatch} or {@link CFLink.unwatch}
		 */
		watchCOMPort: function(callback, me) {
			return CFLink.watch(CFLink.RS232Port.SERIAL_DATA_RECEIVED, this, function (evt, sender, portObject, data) {
				if (portObject === this.rs232Port) {
					callback.apply(me, [this, data ]);
				}
			}, this);
		},

		/**
		 * Configure the onboard COM port of the device has one
		 * @param mode			the mode to set (see {@link CFLink.RS232Port.Valid.Modes})
		 * @param baud			the port speed to set (see {@link CFLink.RS232Port.Valid.Bauds})
		 * @param dataBits		the number of data bits (7 or 8)
		 * @param parity		the parity ("N" for none, "E" for even, "O" for odd)
		 * @param stopBits		the number of stop bits (1 or 2)
		 * @param flowControl	whether to apply flow control (true or false and 1 or 0 accepted)
		 */
		configureCOMPort : function(mode, baud, dataBits, parity, stopBits, flowControl) {
			if (this.rs232Port != null) {
				this.send("C", "SPC", this.rs232Port.configureCommand(mode, baud, dataBits, parity, stopBits, flowControl));
			}
		},

		/**
		 * Setup a callback function that will be called whenever the device's onboard COM port configuration changes
		 * Having multiple callback monitoring the onboard COM port is allowed.
		 *
		 * Your callback function should be of the form:
		 *
		 * myCallback(deviceObject, rs232PortObject)
		 *
		 * Where `deviceObject' is the {@link CFLink.Device} device object (for example a {@link CFLink.CFMini} object),
		 * and `rs232PortObject' is the RS232 port object with its updated config.
		 *
		 * @param {Function} callback    your callback function, of the form myCallback(deviceObject, rs232PortObject)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {Number} a watcherID you can use to unwatch with {@link CFLink.Device.unwatch} or {@link CFLink.unwatch}
		 */
		watchCOMPortConfig: function(callback, me) {
			return CFLink.watch(CFLink.RS232Port.COMPORT_CONFIGURATION_CHANGE, this, function (evt, sender, portObject) {
				if (portObject === this.rs232Port) {
					callback.apply(me, [this, portObject]);
				}
			}, this);
		},

		/**
		 * Stop watching the changes you asked to be notified for in {@link CFLink.Device.watchCOMPort}
		 * You could as well call {@link CFLink.unwatch} which does the same thing.
		 * @param {Number} watcherID the watcher ID that was returned by {@link CFLink.Device.watchCOMPort}
		 */
		unwatch:function (watcherID) {
			CFLink.unwatch(watcherID);
		},

		/**
		 * Function called by reply data listeners.
		 * This function is called by subclasses via $super after processing its device specific data first
		 * and only if no match was found within the subclass reply parsing
		 * @param data
		 * @param regex
		 * @param me
		 * @private
		 */
		replyData:function (data, regex, me) {
			switch (data[4]) {
				case "WHO":
					// Received response to an identification request. We send such a request when
					// devices are being created manually (not from discovery) to complete the information
					// we have about them
					data = data[5].split(":");
					me.serial = data[1];
					me.firmwareVer = data[2];
					me.protocolVer = data[3];
					// Fire an event
					CFLink.fire(CFLink.Device.INFO_RECEIVED, me, [ ]);
					break;

				case "DID":
					// Changed the device ID
					// Update any reply data callbacks that are tied to the old ID for this device
					var oldID = data[5].split(":")[0]; // Reply can optionally have the serial number as a second parameter, so ignore that
					// Update the ID of the device
					me.id = ("0"+data[1].charCodeAt(0).toString(16)).slice(-2).toUpperCase();
					// Remove the old listener now that the device ID change has been confirmed
					CFLink.removeCallbackByCFLinkID(oldID);
					// Fire an event
					CFLink.fire(CFLink.Device.ID_CHANGED, me, [ oldID ]);
					break;

				case "LDR":
					// Catch boot loader notifications
					data = data[5].split(":");
					var ready = (data[1] === "App_OK");
					// Fire an event
					CFLink.fire(CFLink.Device.REBOOTED, me, [ ready ]);
					break;

				case "TGT":
					// TODO - Target Command replies common across all CFLink devices
					break;

				case "SPC":
					// onboard COM port configuration received
					if (me.rs232Port !== null) {
						me.rs232Port.readConfig(me, data[5]);
					}
					break;

				case "SPR":
					// COM port serial data received
					if (me.rs232Port !== null) {
						me.rs232Port.serialDataReceived(me, data[5]);
					}
					break;
			}
		}
	});

/**
 * Event fired when the ID of a CFLink device has changed. You can observe this
 * event to update your GUI or take any other appropriate action after a device ID change
 * has been successfully completed in the CFLink bus
 *
 * Your callback function should be of the form:
 *
 * function(event, device, oldID)
 * event is the name of this event
 * device is the CFLink.Device object whose ID has changed
 * oldID is the previous CFLink ID this device had on the bus
 *
 * @constant
 */
CFLink.Device.ID_CHANGED = "CFLinkDevice.IDChange";

/**
 * Event fired when a device has rebooted. You can observe this event to take any appropriate
 * action if you need to know that the device is up.
 *
 * Your callback function should be of the form:
 *
 * function(event, device, ready)
 *
 * event is the name of this event
 * device is the CFLink.Device object that just rebooted
 * ready is a boolean, true if the device is up and running, false if its firmware is invalid and it's in "waiting for flash" mode
 *
 * @constant
 */
CFLink.Device.REBOOTED = "CFLinkDevice.Reboot";

/**
 * Event fired when the info (full description) for a device has been received.
 * You can observe this event to take any appropriate action, for example further
 * access the modules of a {@link CFLink.DINMOD4} object once the framework has
 * gathered information about which modules have been plugged in.
 *
 * Your callback function should be of the form:
 *
 * function(event, device, ready)
 *
 * event is the name of this event
 * device is the CFLink.Device object that just rebooted
 * ready is a boolean, true if the device is up and running, false if its firmware is invalid and it's in "waiting for flash" mode
 *
 * @constant
 */
CFLink.Device.INFO_RECEIVED = "CFLinkDevice.InfoReceived";
CFLink.Module = Class.$extend(
	/**
	 * @lends CFLink.Module.prototype
	 */
	{
		/**
		 * This object is the base JavaScript interface for all CommandFusion Pluggable Modules.
		 * Each module can have various sets of ports, the exact set of which is configured
		 * for each instance at the time the object is created or discovered on the network.
		 *
		 * <br><br>
		 * <B>Do not instantiate this object directly</B>. Devices supporting modules (DIN-MOD4 and MOD4)
		 * automatically create the interfaces according to the modules physically inserted in the slots.
		 *
		 * @summary Represents a module inserted in a DIN-MOD4 or MOD4 device
		 * @constructs
		 * @protected
		 */
		__init__ : function (ownerDevice, modelName, commandPrefix, moduleNumber, numIOPorts, numCOMPorts, numIRPorts, numRelays) {
			this.systemName = ownerDevice.systemName;
			this.deviceID = ownerDevice.cflinkID;
			this.model = modelName;
			this.commandPrefix = commandPrefix;
			this.moduleNum = moduleNumber;
			this.moduleString = "M" + this.moduleNum;

			this.IOPorts = [];
			this.COMPorts = [];
			this.IRPorts = [];
			this.Relays = [];

			var i;
			for (i = 1; i <= numIOPorts; i++) {
				this.IOPorts.push(new CFLink.IOPort(ownerDevice, i));
			}
			for (i = 1; i <= numCOMPorts; i++) {
				this.COMPorts.push(new CFLink.RS232Port(ownerDevice.cflinkID, this.commandPrefix, i));
			}
			for (i = 1; i <= numIRPorts; i++) {
				// TODO: IR ports
			}
			for (i = 1; i <= numRelays; i++) {
				this.Relays.push(new CFLink.RelayPort(this, i));
			}
		},

		/**
		 * Retuns true if this module object owns the given port object
		 * @param portObject
		 * @returns {Boolean} true if the port object (a {@link CFLink.IOPort} object or one of its subclasses) is one of this module's ports
		 * @private
		 */
		ownsPort: function(portObject) {
			return (
				this.IOPorts.indexOf(portObject) != -1 ||
					this.COMPorts.indexOf(portObject) != -1 ||
					this.IRPorts.indexOf(portObject) != -1 ||
					this.Relays.indexOf(portObject) != -1);
		},

		/**
		 * Send a CFLink packet to the CFLink module this object represents
		 * @param {String} commandType the command type (i.e. "Q", "T", "C", etc)
		 * @param {String} command the command (i.e. "SET")
		 * @param {String} payload the actual payload of the CFLink packet
		 */
		send: function(commandType, command, payload) {
			CFLink.buildMsg(this.systemName, this.deviceID, commandType, this.commandPrefix, command, payload);
		},

		/**
		 * Query the module configuration based on the declared ports
		 * @private
		 */
		queryConfig : function() {
			if (this.IOPorts.length) {
				// Query config
				this.send("Q", "CFG", this.moduleString);
				// Query port settings
				this.send("Q", "PRT", this.moduleString);
				// Query port status
				this.send("Q", "STA", this.moduleString);
			}
			if (this.COMPorts.length) {
				this.send("Q", "SPC", this.moduleString);
			}
			if (this.Relays.length) {
				// Query status
				this.send("Q", "STA", this.moduleString);
				// Query power-on state
				this.send("Q", "POS", this.moduleString);
			}
		},

		/**
		 * Internal function that uses methods from the individual ports classes to generate commands
		 * target is "IOX" (I/O ports), "COM" (COM ports), "RLY" (Relay ports) or "IRX" (IR ports).
		 * Index is number or array of numbers
		 * @private
		 */
		_sendPortCommand: function (target, command, index, commandFunction, params, commandType) {
			var msg, o, ports;
			if (commandType === undefined) {
				commandType = "T";	// by default, this is a "transmit"
			}
			switch(target) {
				case "IOX":
					ports = this.IOPorts;
					break;
				case "COM":
					ports = this.COMPorts;
					break;
				case "RLY":
					ports = this.Relays;
					break;
				case "IRX":
					ports = this.IRPorts;
					break;
			}
			if (index instanceof Array) {
				var i, n = index.length, l;
				msg = "";
				for (i = 0; i < n; i++) {
					l = index[i];
					if (CF.debug && (l < 1 || l > ports.length)) {
						CF.log("Warning: " + this.model + " " + target + " port number " + l + " is not in the range 1-" + ports.length);
						continue;
					}
					o = ports[l-1];
					if (i > 0)
						msg = msg + "|" + o[commandFunction].apply(o, params);
					else
						msg = o[commandFunction].apply(o, params);
				}
				this.send(commandType, command, this.moduleString + "|" + msg);
			} else {
				if (CF.debug && (index < 1 || index > ports.length)) {
					CF.log("Warning: " + this.model + " " + target + " port number " + index + " is not in the range 1-" + ports.length);
					return;
				}
				o = ports[index-1];
				this.send(commandType, command, this.moduleString + "|" + o[commandFunction].apply(o, params));
			}
		},

		/** @private */
		_checkValid: function (array, type, index, caller) {
			if (index instanceof Array) {
				for (var i=0; i < index.length; i++) {
					if (!this._checkValid(array, index[i], caller)) {
						return false;
					}
				}
			}
			if (index < 1 || index > array.length) {
				CF.log("Warning: " + this.model + "." + caller + ": invalid " + type + " index:" + index);
				return false;
			}
			return true;
		},

		//
		// IO ports commands
		//

		/** @private */
		_checkValidIOPort : function (index, caller) {
			return this._checkValid(this.IOPorts, "I/O port", index, caller);
		},

		/**
		 * For IO ports configured as external relay control output or LED output,
		 * set the value (0 = open for relays, off for LEDs - 1 = closed for relays, on for LEDs)
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to set the value of multiple
		 * I/O ports at once.
		 *
		 * @param {Number, Array} index		the I/O port index (starts at 1, limited to the number of I/O ports in the module) or an array of I/O port indices
		 * @param {Number} value	the new value of the output port (0 or 1)
		 * @instance
		 */
		setIOPortValue : function(index, value) {
			if (this._checkValidIOPort(index, "setIOPortValue")) {
				this._sendPortCommand("IOX", "SET", index, "setCommand", [ (value === true || value === 1 || value === "1") ]);
			}
		},

		/**
		 * For IO ports configured as external relay control output or LED output,
		 * toggle the value (0 = open for relays, off for LEDs - 1 = closed for relays, on for LEDs)
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to toggle the value of multiple
		 * I/O ports at once.
		 *
		 * @param {Number, Array} index		the I/O port index (starts at 1, limited to the number of I/O ports in the module) or an array of I/O port indices
		 */
		toggleIOPortValue : function(index) {
			if (this._checkValidIOPort(index, "toggleIOPortValue")) {
				this._sendPortCommand("IOX", "SET", index, "toggleCommand", [ ]);
			}
		},

		/**
		 * Configure an I/O port to set its operating mode, as well as minimum change value and power-on state
		 * (when applicable, depends on the chosen mode). Note that the command is being sent to the device, but
		 * the known values of the JavaScript representation of the port will stay the same until we receive
		 * the acknowledge from the device.
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to configure multiple
		 * ports at once with the same settings
		 *
		 * @param {Number, Array} index		the I/O port index (starts at 1, limited to the number of I/O ports in the module) or an array of I/O port indices
		 * @param {CFLink.IOPort.Mode} mode the I/O port mode
		 * @param {Number} minChange the minimum change value for I/O ports that are set to. Meaningful for {@link CFLink.IOPort.Mode.RESISTANCE_READING}, {@link CFLink.IOPort.Mode.
		 */
		configureIOPort : function(index, mode, minChange, powerOnState) {
			if (this._checkValidIOPort(index, "configureIOPort")) {
				this._sendPortCommand("IOX", "PRT", index, "configureCommand", [ mode, minChange, powerOnState ], "C");
			}
		},

		/**
		 * Obtain the underlying {@link CFLink.IOPort} object associated with one of modules IO ports
		 * You should seldom need to call this function.
		 * @param {number} index	index of the IO port
		 * @return {CFLink.IOPort} 	an IOPort object
		 * @instance
		 */
		getIOPort : function(index) {
			return this.IOPorts[index - 1];
		},

		/**
		 * Setup a callback function that is called when the state of the selected I/O port(s) change
		 *
		 * Your callback function should be of the form:
		 *
		 * myCallback(deviceObject, moduleObject, portNumber, previousValue, newValue)
		 *
		 * Where `deviceObject' is the {@link CFLink.Device} device object (typically, a {@link CFLink.DINMOD4} object),
		 * `moduleObject' is the {@link CFLink.Module} object representing the module plugged in the device,
		 * `portNumber' is the I/O port number that changed value, `previousValue' is the previous value of this I/O port,
		 * and `newValue' is its new value.
		 *
		 * Note that when we get the initial value of the I/O port (at initialization time), the `previousValue'
		 * parameter will be -1.
		 *
		 * @param {Array} portNumbers    an array of the I/O port numbers to watch (relays are numbered from 1 to 4). Pass `null' to watch all I/O ports
		 * @param {Function} callback    your callback function, of the form: myCallback(deviceObject, moduleObject, portNumber, previousValue, newValue)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {Number} a watcherID you can use to unwatch with {@link CFLink.Module.unwatch} or {@link CFLink.unwatch}
		 */
		watchIOPorts: function(portNumbers, callback, me) {
			if (!(portNumbers instanceof Array)) {
				portNumbers = [ portNumbers ];			// fix programmer mistakes
			}
			var device = CFLink.getDeviceForModulePort(this);
			return CFLink.watch(CFLink.IOPort.VALUE_CHANGE, device, function (evt, sender, portObject, previousState, newState) {
				if (this.IOPorts.indexOf(portObject) != -1 && (portNumbers[0] == null || portNumbers.indexOf(portObject.portNumber) != -1)) {
					callback.apply(me, [device, this, portObject.portNumber, previousState, newState]);
				}
			}, this);
		},

		//
		// Relay commands
		//

		/** @private */
		_checkValidRelay : function (index, caller) {
			return this._checkValid(this.Relays, "relay", index, caller);
		},

		/**
		 * Set the state of a relay.
		 * Note that if you are in the middle of a relay pulse for this relay,
		 * the pulse is cancelled and the relay state is updated immediately.
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to open or close multiple relays at once
		 *
		 * @param {Number, Array} index		the relay index (starts at 1, limited to the number of relays in the module) or an array of relay indices
		 * @param {Number, Boolean} on		Pass 1 or true to close the relay, 0 or false to open it
		 */
		setRelayState: function (index, on) {
			if (this._checkValidRelay(index, "setRelayState")) {
				this._sendPortCommand("RLY", "SET", index, "setCommand", [ (on === true || on === 1 || on === "1") ]);
			}
		},

		/**
		 * Toggle the state of a relay (open if closed, close if opened).
		 * Note that if you are in the middle of a relay pulse for this relay,
		 * the pulse is cancelled and the relay state is updated immediately.
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to toggle multiple relays at once
		 *
		 * @param {Number, Array} index		the relay index (starts at 1, limited to the number of relays in the module) or an array of relay indices
		 */
		toggleRelayState: function (index) {
			if (this._checkValidRelay(index, "toggleRelayState")) {
				this._sendPortCommand("RLY", "SET", index, "toggleCommand", [ ]);
			}
		},

		/**
		 * Pulse a relay for the specified duration. A pulse will close the relay, then open it again after
		 * the specified duration. Duration is in 1/10s units.
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to pulse multiple relays at once
		 *
		 * @param {Number, Array} index		the relay index (starts at 1, limited to the number of relays in the module) or an array of relay indices
		 * @param {Number} duration	the duration. An integer that represent a number of 1/10s. For example, the value 10 represents 1 second.
		 */
		pulseRelayState : function(index, duration) {
			if (this._checkValidRelay(index, "pulseRelayState")) {
				this._sendPortCommand("RLY", "SET", index, "pulseCommand", [ duration ]);
			}
		},

		/**
		 * Set the power-on state of a relay (the state the relay should be in at power-on).
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to configure multiple
		 * relays at once
		 *
		 * @param {Number, Array} index		the relay index (starts at 1, limited to the number of relays in the module) or an array of relay indices
		 * @param powerOnState	pass 1 for the relay to be in closed state at power-on. Pass 0 for the relay to be in open state at power-on.
		 */
		configureRelay : function(index, powerOnState) {
			if (this._checkValidRelay(index, "configureRelay")) {
				this._sendPortCommand("RLY", "POS", index, "configureCommand", [ powerOnState ], "C");
			}
		},

		/**
		 * Setup a callback function that is called when the state of the selected Relay port(s) change
		 * This is a simple helper that watches the {@link CFLink.IOPort.VALUE_CHANGE} event and only calls you back
		 * when one of the Relay ports you want to watch changes state.
		 *
		 * Your callback function should be of the form:
		 *
		 * myCallback(deviceObject, moduleObject, portNumber, previousValue, newValue)
		 *
		 * Where `deviceObject' is the {@link CFLink.Device} device object (typically, a {@link CFLink.DINMOD4} object),
		 * `moduleObject' is the {@link CFLink.Module} object representing the module plugged in the device,
		 * `portNumber' is the Relay port number that changed state, `previousValue' is the previous value of this Relay port (0 or 1),
		 * and `newValue' is its new value.
		 *
		 * Note that when we get the initial value of the relay (at initialization time), the `previousValue'
		 * parameter will be -1.
		 *
		 * @param {Array} portNumbers    an array of the relay port numbers to watch (relays are numbered from 1 to 4). Pass `null' to watch all relays
		 * @param {Function} callback    your callback function, of the form: myCallback(deviceObject, moduleObject, portNumber, previousValue, newValue)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {Number} a watcherID you can use to unwatch with {@link CFLink.Module.unwatch} or {@link CFLink.unwatch}
		 */
		watchRelays : function(portNumbers, callback, me) {
			if (!(portNumbers instanceof Array)) {
				portNumbers = [ portNumbers ];			// fix programmer mistakes
			}
			if (portNumbers[0] !== null && !this._checkValidRelay(portNumbers, "watchRelays")) {
				return 0;
			}
			var device = CFLink.getDeviceForModule(this);
			return CFLink.watch(CFLink.IOPort.VALUE_CHANGE, device, function (evt, sender, portObject, previousState, newState) {
				if (this.Relays.indexOf(portObject) != -1 && (portNumbers[0] == null || portNumbers.indexOf(portObject.portNumber) != -1)) {
					callback.apply(me, [device, this, portObject.portNumber, previousState, newState]);
				}
			}, this);
		},

		/**
		 * Stop watching the changes you asked to be notified for in {@link CFLink.Module.watchIOPorts},
		 * {@link CFLink.Module.watchRelays} and {@link CFLink.Module.watchCOMPorts}.
		 * You could as well call {@link CFLink.unwatch} which does the same thing.
		 * @param {Number} watcherID the watcher ID that was returned by {@link CFLink.Module.watchIOPorts}, {@link CFLink.Module.watchRelays} or {@link CFLink.Module.watchCOMPorts}
		 */
		unwatch:function (watcherID) {
			CFLink.unwatch(watcherID);
		},

		//
		// COM port commands
		//

		/**
		 * Send data to a COM port
		 * @param index		the COM port index, between 1 and the number of COM ports in the module
		 * @param data		the data to send. Data is being sent verbatim. You can pass a string, or an array of character codes
		 * 					(if you pass an array, the software assumes these are character codes, and will turn each code into a byte)
		 */
		sendCOMData : function(index, data) {
			if (data instanceof Array) {
				data = String.fromCharCode.apply(null, data);
			}
			if (this._checkValidCOM(index, "sendCOMData")) {
				this._sendPortCommand("COM", "SPW", index, "sendDataCommand", [ data ]);
			}
		},

		/**
		 * Configure one of the module's COM ports, if the module is a COM module
		 * @param index			the COM port index, between 1 and the number of COM ports in the module
		 * @param mode			the mode to set (see {@link CFLink.RS232Port.Valid.Modes} or {@link CFLink.RS232Port.Valid.Modes_COM})
		 * @param baud			the port speed to set (see {@link CFLink.RS232Port.Valid.Bauds})
		 * @param dataBits		the number of data bits (7 or 8)
		 * @param parity		the parity ("N" for none, "E" for even, "O" for odd)
		 * @param stopBits		the number of stop bits (1 or 2)
		 * @param flowControl	whether to apply flow control (true or false and 1 or 0 accepted)
		 */
		configureCOMPort : function(index, mode, baud, dataBits, parity, stopBits, flowControl) {
			this._sendPortCommand("COM", "SPC", index, "configureCommand", [ mode, baud, dataBits, parity, stopBits, flowControl ], "C");
		},

		/**
		 * Setup a callback function that will be called whenever data is received on the specified ports (assuming the
		 * module is a COM module). Your callback can monitor one, several or all COM ports of the module. Having multiple
		 * callback monitoring the same COM ports is allowed. If you don't specify the port numbers (pass null or an empty array),
		 * by default you will be called for data received on all COM ports.
		 *
		 * Your callback function should be of the form:
		 *
		 * myCallback(deviceObject, moduleObject, portNumber, data)
		 *
		 * Where `deviceObject' is the {@link CFLink.Device} device object (typically, a {@link CFLink.DINMOD4} object),
		 * `moduleObject' is the {@link CFLink.Module} object representing the module plugged in the device,
		 * `portNumber' is the COM port number that received data, and `data' is the received data (a String that may contain
		 * binary characters, as all received data is passed verbatim to you).
		 *
		 * @param {Array} portNumbers    an array of the COM port numbers to watch (COM ports are numbered from 1 to 8 for the IO8 module). Pass `null' to watch all COM ports
		 * @param {Function} callback    your callback function, of the form myCallback(deviceObject, moduleObject, portNumber, data)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {Number} a watcherID you can use to unwatch with {@link CFLink.Module.unwatch} or {@link CFLink.unwatch}
		 */
		watchCOMPorts: function(portNumbers, callback, me) {
			if (!(portNumbers instanceof Array)) {
				portNumbers = [ portNumbers ];			// fix programmer mistakes
			}
			var device = CFLink.getDeviceForModulePort(this);
			return CFLink.watch(CFLink.RS232Port.SERIAL_DATA_RECEIVED, device, function (evt, sender, portObject, data) {
				if (this.COMPorts.indexOf(portObject) != -1 && (portNumbers[0] == null || portNumbers.indexOf(portObject.portNumber) != -1)) {
					callback.apply(me, [device, this, portObject.portNumber, data]);
				}
			}, this);
		},

		/**
		 * Setup a callback function that will be called whenever the specified ports configuration changes (assuming the
		 * module is a COM module). Your callback can monitor one, several or all COM ports of the module. Having multiple
		 * callback monitoring the same COM ports is allowed. If you don't specify the port numbers (pass null or an empty array),
		 * by default you will be called for configuration changes on all COM ports.
		 *
		 * Your callback function should be of the form:
		 *
		 * myCallback(deviceObject, moduleObject)
		 *
		 * Where `deviceObject' is the {@link CFLink.Device} device object (typically, a {@link CFLink.DINMOD4} object),
		 * `moduleObject' is the {@link CFLink.Module} object representing the module plugged in the device,
		 * `portNumber' is the COM port number that changed configuration, and `data' is the received data (a String that may contain
		 * binary characters, as all received data is passed verbatim to you).
		 *
		 * @param {Array} portNumbers    an array of the COM port numbers to watch (COM ports are numbered from 1 to 8 for the IO8 module). Pass `null' to watch all COM ports
		 * @param {Function} callback    your callback function, of the form myCallback(deviceObject, moduleObject, portNumber, data)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {Number} a watcherID you can use to unwatch with {@link CFLink.Module.unwatch} or {@link CFLink.unwatch}
		 */
		watchCOMPortConfig: function(portNumbers, callback, me) {
			if (!(portNumbers instanceof Array)) {
				portNumbers = [ portNumbers ];			// fix programmer mistakes
			}
			var device = CFLink.getDeviceForModulePort(this);
			return CFLink.watch(CFLink.RS232Port.COMPORT_CONFIGURATION_CHANGE, device, function (evt, sender, portObject) {
				if (this.COMPorts.indexOf(portObject) != -1 && (portNumbers[0] == null || portNumbers.indexOf(portObject.portNumber) != -1)) {
					callback.apply(me, [device, this]);
				}
			}, this);
		},

		//
		// CFLink messages processing
		//

		/** @private */
		handleMessage: function (target, command, payload, device) {
			switch (target) {
				// message going to one of the IOPorts
				case "IOX":
					this.processIOPortReply(command, payload, device);
					break;
				case "IRX":
					// TODO: IR
					break;
				case "COM":
					this.processCOMPortReply(command, payload, device);
					break;
				case "RLY":
					this.processRelayReply(command, payload, device);
					break;
			}
		},

		/** @private */
		processIOPortReply: function(command, payload, device) {
			var values, n, i, portNum;
			switch (command) {
				case "CFG":
					// I/O module configuration
					var config = payload.split(":");
					this.IOEnabled = config[1];
					this.IOReportOnChange = config[2];
					this.IOReportInterval = parseInt(config[3], 10);
					CFLink.fire(CFLink.Module.IO_CONFIGURATION_CHANGE, device, this);
					break;
				case "PRT":
					// IO Port Configuration
					// eg: MM|P01:L:0:0|P02:D:0:0|P03:V:0:0|P04:R:0:0
					values = payload.split("|");
					for (i = 1, n = values.length; i < n; i++) {
						var portConfig = values[i].split(":");
						if (portConfig.length >= 4) {
							// the setConfiguration call takes care of firing a config change event if needed
							portNum = parseInt(portConfig[0].substring(1), 10);
							this.IOPorts[portNum - 1].portConfigurationReceived(device, portConfig[1], portConfig[2], portConfig[3]);
						}
					}
					CFLink.fire(CFLink.Module.IOPORT_CONFIGURATION_CHANGE, device, this);
					break;
				case "STA":
				case "CHA":
					// I/O ports state (mode, open/closed)
					values = payload.split("|");
					for (i = 1, n = values.length; i < n; i++) {
						var iostatus = values[i].split(":");
						portNum = parseInt(iostatus[0].substring(1), 10);
						if (portNum > 0 && portNum <= this.IOPorts.length) {
							// the updatePortState call takes care of firing a state change event if there is an actual change
							this.IOPorts[portNum - 1].portValueChanged(device, iostatus[1], parseInt(iostatus[2],10));
						}
					}
					break;
			}
		},

		/** @private */
		processCOMPortReply: function(command, payload, device) {
			var values, n, i, portNum;
			switch (command) {
				case "SPC":
					// COM port configuration reply
					// e.g. MM|<PORT01 config>|<PORT02 config>|...|<PORTN config>
					values = payload.split("|");
					for (i = 1, n = values.length; i < n; i++) {
						var cfg = values[i];
						var sep = cfg.indexOf(':');
						if (sep > 0) {
							portNum = parseInt(cfg.substring(1), 10);
							this.COMPorts[portNum - 1].readConfig(this, cfg.substring(sep+1));
						}
					}
					CFLink.fire(CFLink.Module.COMPORT_CONFIGURATION_CHANGE, device, this);
					break;
				case "SPR":
					// COM port serial data received
					var s = payload;
					var idx = s.indexOf('|');
					if (idx > 0) {
						portNum = parseInt(s.substring(idx+2),10);
						idx = s.indexOf(':',idx);
						if (idx > 0) {
							this.COMPorts[portNum - 1].serialDataReceived(device, s.substring(idx+1));
						}
					}
					break;
			}
		},

		/** @private */
		processRelayReply: function(command, payload, device) {
			var values, i, n, portNum, relay;
			switch (command) {
				case "STA":
					values = payload.split("|");
					n = values.length;
					for (i=0; i < n; i++) {
						data = values[i].split(":");
						if (data.length === 2) {
							portNum = parseInt(data[0].substring(1), 10);
							if (portNum >= 1 && portNum <= this.Relays.length) {
								relay = this.Relays[portNum-1];
								relay.portValueChanged(device, relay.mode, parseInt(data[1], 10));
							}
						}
					}
					break;

				case "POS":
					values = payload.split("|");
					n = values.length;
					for (i=0; i < n; i++) {
						data = values[i].split(":");
						if (data.length === 2) {
							portNum = parseInt(data[0].substring(1), 10);
							if (portNum >= 1 && portNum <= this.Relays.length) {
								relay = this.Relays[portNum-1];
								relay.powerOnStateReceived(this, relay.mode, parseInt(data[1], 10));
							}
						}
					}
					break;

				case "TGT":
					// TODO: notification targets configuration reply
					break;
			}
		}
	});

/**
 * Event fired when a module's global configuration changes (one of the enabled,
 * reportOnChange, reportInterval flags is updated). Your callback should be of the form:
 * function(event, device, module)
 * event is this event
 * device is the device object containing the I/O module (typically a MOD4 or DINMOD4 device)
 * module is the I/O module object
 * @type {String}
 */
CFLink.Module.IO_CONFIGURATION_CHANGE = "ModuleDevice_IOConfigurationChange";

/**
 * Event fired when a module's ports configuration changes. This event is fired after each
 * individual IO port's {@link CFLink.IOPort.CONFIGURATION_CHANGE} event is fired, to allow your
 * code to perform any necessary global update (i.e. GUI update)
 * Your callback should be of the form:
 * function(event, device, module)
 * event is this event
 * device is the device object containing the I/O module (typically a MOD4 or DINMOD4 device)
 * module is the I/O module object
 * @type {String}
 */
CFLink.Module.IOPORT_CONFIGURATION_CHANGE = "ModuleDevice_IOPortConfigurationChange";

/**
 * Event fired when a module's COM ports configuration changes. This event is fired after each
 * individual IO port's {@link CFLink.RS232Port.CONFIGURATION_CHANGE} event is fired, to allow your
 * code to perform any necessary global update (i.e. GUI update)
 * Your callback should be of the form:
 * function(event, device, module)
 * event is this event
 * device is the device object containing the COM module (typically a MOD4 or DINMOD4 device)
 * module is the COM module object
 * @type {String}
 */
CFLink.Module.COMPORT_CONFIGURATION_CHANGE = "ModuleDevice_COMPortConfigurationChange";
CFLink.IOPort = Class.$extend(
	/**
	 * @lends CFLink.IOPort.prototype
	 * @private
	 */
	{
		// these members are here for documentation purposes only
		// that's why we set their value to null

		/**
		 * The CFLink device ID of the device holding this port
		 * @type String
		 */
		deviceID: null,
		/**
		 * The port number for this port in the device (starts at 1)
		 * @type Number
		 */
		portNumber: null,
		/**
		 * The port number of this port, as a string
		 * @type String
		 */
		portNumberString: null,
		/**
		 * The current Mode of this port. Do not change it directly
		 * @type CFLink.IOPort.Mode
		 */
		mode: null,
		/**
		 * The current state of the port. Do not change it directly.
		 * For I/O ports configured as relay ports, state is either 0 (open) or 1 (closed)
		 * For I/O ports configured as dry contact inputs, voltage trigger or video sensing input, it is 0 or 1
		 * For I/O ports configured for voltage or resistance reading, it is the actual value read on the port.
		 * @type Number
		 */
		state: -1,
		/**
		 * For port modes that support it (i.e. voltage digital trigger), the minimum change that triggers a state change
		 * @type Number
		 */
		minChange: null,
		/**
		 * The power-on state of this port, when application (otherwise, 0)
		 * @type Number
		 */
		powerOnState: null,

		/**
		 * An IOPort object represents a single IO port on a CF device or module.
		 * Since ports can be configured to perform several functions, you can obtain
		 * the current port mode by reading the {@link CFLink.IOPort.mode} property, which is one of the
		 * values in {@link CFLink.IOPort.Mode}.
		 *
		 * <br><br>
		 * This class is a low-level object that you shouldn't need to use directly. Use the convenience methods
		 * in the device classes instead.
		 * <br>
		 * Instances of this object are being created for you by the device class that
		 * holds the port (i.e. {@link CFLink.CFMini}, {@link CFLink.DINMOD4}).
		 *
		 * @summary Represents one I/O port of a CFLink device or module. Do not use directly.
		 * @constructs
		 * @protected
		 */
		__init__ : function (ownerDevice, portNum, mode, minChange, powerOnState) {
			this.systemName = ownerDevice.systemName;
			this.deviceID = ownerDevice.cflinkID;
			this.cflinkPrefix = ownerDevice.commandPrefix;
			this.portNumber = portNum;
			this.portNumberString = "P" + padBeginning(2,"0",String(portNum));
			this.mode = mode || CFLink.IOPort.Mode.DRY_CONTACT;
			this.minChange = minChange || 0;
			this.powerOnState = powerOnState || 0;
			if (this.mode == CFLink.IOPort.Mode.LED_OUTPUT) {
				this.state = CFLink.LEDPort.State.NOT_CHANGING;
			} else {
				this.state = -1;
			}
		},

		/** @private */
		portConfigurationReceived : function (device, mode, minChange, powerOnState, justCreated) {
			var changed = !justCreated && (this.mode !== mode || this.minChange !== minChange || this.powerOnState !== powerOnState);
			this.mode = mode || CFLink.IOPort.Mode.DRY_CONTACT;
			this.minChange = minChange || 0;
			this.powerOnState = powerOnState || 0;
			if (changed) {
				CFLink.fire(CFLink.IOPort.CONFIGURATION_CHANGE, device, [ this ]);
			}
		},

		/** @private */
		powerOnStateReceived : function (device, powerOnState) {
			// the update will fire an event only if there is a change
			if (this.powerOnState !== powerOnState) {
				this.powerOnState = powerOnState;
				CFLink.fire(CFLink.IOPort.CONFIGURATION_CHANGE, device, [ this ]);
			}
		},

		/** @private */
		portValueChanged : function (device, mode, state) {
			// the update will fire an event only if there is a change
			if (this.mode !== mode || this.state !== state) {
				var previous = this.state;
				this.mode = mode;
				this.state = state;
				CFLink.fire(CFLink.IOPort.VALUE_CHANGE, device, [ this, previous, state ]);
			}
		},

		//
		// Command generators
		//

		/** @private */
		toggleCommand : function() {
			return this.portNumberString + ":T";
		},

		/** @private */
		setCommand : function(on) {
			return this.portNumberString + (on ? ":1" : ":0");
		},

		/** @private */
		configureCommand : function(mode, minChange, powerOnState) {
			if (mode !== CFLink.IOPort.Mode.RESISTANCE_READING && mode !== CFLink.IOPort.Mode.VOLTAGE_READING) {
				minChange = 0;
				powerOnState = 0;
			}
			return [
				this.portNumberString,
				mode || this.mode,
				minChange || this.minChange,
				powerOnState || this.powerOnState ].join(":");
		},

		getModeString: function() {
			switch (this.mode) {
				case "D" :
					return "Dry Contact";
				case "R" :
					return "Resistance Read";
				case "A" :
					return "Voltage Read";
				case "V" :
					return "Voltage Sense";
				case "E" :
					return "External Relay";
				case "L" :
					return "External LED";
				case "S" :
					return "Video Sense";
				case "B" :
					return "Voltage Average";
			}
		},

		stateString: function() {
			switch (this.mode) {
				case "D" :
					return (this.state ? "CLOSED" : "OPEN");
				case "R" :
					return ((this.state / 10) + "Ohms");
				case "A" :
					return ((this.state / 10) + "VDC");
				case "V" :
					return this.state;
				case "E" :
					return (this.state ? "ON" : "OFF");
				case "L" :
					return (this.state ? "ON" : "OFF");
				case "S" :
					return this.state;
				case "B" :
					return ((this.state / 10) + "VDC");
			}
		}
	});

/**
 * Constants defining the mode an I/O port can be configured to
 * @enum
 */
CFLink.IOPort.Mode = {
	/** Port configured as a dry contact input @constant */
	DRY_CONTACT: 'D',

	/** Port configured for reading resistance values up to 10000 ohms */
	RESISTANCE_READING : 'R',

	/** Port configured as a digital trigger based on input voltage (will return 0 or 1) */
	VOLTAGE_TRIGGER: 'V',

	/** Port configured as an analog voltage (0.0v to 10.0v) reading input */
	VOLTAGE_READING: 'A',

	/** Port configured to sense video signals */
	VIDEO_SENSING: 'S',

	/** port is an external relay control output (0-24V DC) */
	RELAY_CONTROL_OUTPUT: 'E',

	/** Port configured as an external LED output (1ma) */
	LED_OUTPUT: 'L'
};

/**
 * Event fired when the value (input or output) of an I/O port changes. For example, a different voltage
 * could have been read, or a relay could have been closed.
 * Your callback function for watching this event should be of the type:
 *
 * function(event, sender, portObject, oldValue, newValue)
 *
 * the portObject is an object of type {@link CFLink.IOPort}. From it, you can obtain the current mode as well.
 * the oldValue is the previous value (-1 the first time one is received)
 * the newValue is the new value
 *
 * @constant
 */
CFLink.IOPort.VALUE_CHANGE = "IOX_ValueChange";

/**
 * Event fired when an IOPort's configuration changes
 * Your callback function for watching this event should be of the type:
 * function(event, sender, portObject)
 * the portObject is an object of type {@link CFLink.IOPort}. From it, you can obtain the current mode and state.
 * This event is also sent by LED subclasses (for specialized LEDs on SW16 and others)
 * @constant
 */
CFLink.IOPort.CONFIGURATION_CHANGE = "IOX_ConfigChange";
CFLink.LEDPort = CFLink.IOPort.$extend(
	/**
	 * @lends CFLink.LEDPort.prototype
	 * @extends CFLink.IOPort
	 */
	{
		/**
		 * A LED object is a specialized version of an IOPort object which gives access
		 * to the specific functionalities of LEDs as found on SW16.
		 *
		 * <br><br>
		 * This class is a low-level object that you shouldn't need to use directly. Use the convenience methods
		 * in the device classes instead.
		 * <br>
		 * Instances of this object are being created for you by the device class that
		 * holds the port ({@link CFLink.SW16}).
		 *
		 * @constructs
		 * @protected
		 * @summary Do not use directly
		 */
		__init__ : function (ownerDevice, portNum, backlight) {
			this.$super(ownerDevice, portNum, CFLink.IOPort.Mode.LED_OUTPUT);
			this.backlight = backlight;
			this.state = CFLink.LEDPort.State.NOT_CHANGING;
			this.level = -1;
		},

		updateLEDState : function (device, state, level) {
			if (this.state !== state || this.level !== level) {
				this.state = state;
				this.level = level;
				CFLink.fire(CFLink.LEDPort.STATE_CHANGE, device, [ this, state, level ]);
			}
		},

		pulseLEDCommand : function(time) {
			return this.portNumberString + ":P:" + time;
		},

		rampLEDCommand : function(level, time) {
			return this.portNumberString + ":R:" + level + ":" + time;
		},

		blinkLEDCommand : function(minLevel, maxLevel, timeOn, timeOff, count) {
			return this.portNumberString + ":B:" + minLevel + ":" + maxLevel + ":" + timeOn + ":" + timeOff + ":" + count;
		},

		dimLEDCommand : function(minLevel, maxLevel, timeOn, timeOff, count) {
			return this.portNumberString + ":D:" + minLevel + ":" + maxLevel + ":" + timeOn + ":" + timeOff + ":" + count;
		}
	});

/**
 * LED state constants. These constants define the current state reported by individual LEDs in
 * a SW16.
 * @enum
 */
CFLink.LEDPort.State = {
	/**
	 * LED state is unknown
	 * @constant
	 */
	UNKNOWN: "?",

	/**
	 * LED is not changing state
	 * @constant
	 */
	NOT_CHANGING: "X",

	/** LED is blinking */
	BLINKING: "B",

	/** LED is executing a pulse command */
	PULSING: "P",

	/** LED is executing a ramp command */
	RAMPING: "R",

	/** LED is executing a dim command */
	DIMMING: "D"
};

/**
 * LED state change event, fired when receive a state or level change from the device
 * Your callback function for watching this event should be of the form:
 *
 * function(event, sender, LEDobject, state, level)
 *
 * the event parameter is the name of this event
 * the sender parameter is the CFLink.Device or ModuleDevice subclass owning the LED object
 * the LEDobject parameter is an object of type {@link CFLink.LEDPort}. sender is that CFLink.Device or ModuleDevice object
 * that contains this LED port.
 * the state parameter is the current state of the port from the enum {@link CFLink.LEDPort.State}
 * the level parameter is the current level of the LED (0-100)
 *
 * @constant
 */
CFLink.LEDPort.STATE_CHANGE = "LED_StateChange";
CFLink.RelayPort = CFLink.IOPort.$extend(
	/**
	 * @lends CFLink.RelayPort.prototype
	 * @extends CFLink.IOPort
	 */
	{
		/**
		 * A RelayPort represents one relay in either a CFMini or a modular relay device
		 * (HRY2, RY4, LRY8, SSRY4)
		 *
		 * <br><br>
		 * This class is a low-level object that you shouldn't need to use directly. Use the convenience methods
		 * in the device classes instead.
		 * <br>
		 * Instances of this object are being created for you by the device class that
		 * holds the port (i.e. {@link CFLink.CFMini}, {@link CFLink.DINMOD4}).
		 *
		 * @param ownerDevice
		 * @param portNum
		 * @constructs
		 * @protected
		 * @summary Do not use directly
		 */
		__init__ : function(ownerDevice, portNum) {
			this.$super(ownerDevice, portNum, CFLink.IOPort.Mode.RELAY_CONTROL_OUTPUT);
		},

		pulseCommand : function(duration) {
			return this.portNumberString + ":P:" + duration;
		},

		configureCommand : function() {
			return this.portNumberString + ":" + this.powerOnState;
		}
	});

/**
 * Constants for POWER-ON state of relay ports
 * @type {Object}
 */
CFLink.RelayPort.PowerOn = {
	/**
	 * At power-on, relay is open (default)
	 * @constant
	 */
	OPEN: "0",
	/**
	 * At power-on, relay is closed
	 * @constant
	 */
	CLOSED: "1",
	/**
	 * At power-on, relay resumes last state
	 * @constant
	 */
	RESUME: "L"
};
CFLink.RS232Port = Class.$extend(
	/**
	 * @lends CFLink.RS232Port.prototype
	 */
	{
		/**
		 * Object representing a COM port on one of the CF devices that can have one
		 * (i.e. LanBridge, CFMini, MOD4, DIN-MOD4) or in a modular device (COM4). It inherits the functions and properties
		 * of {@link CFLink.IOPort}.
		 *
		 * <br><br>
		 * This class is a low-level object that you shouldn't need to use directly. Use the convenience methods
		 * in the device classes instead.
		 * <br>
		 * Instances of this object are being created for you by the device class that
		 * holds the port ({@link CFLink.CFMini}, {@link CFLink.DINMOD4}).

		 * @constructs
		 * @protected
		 * @summary Do not use directly
		 */
		__init__ : function (systemName, deviceID, cflinkPrefix, portNum) {
			// assign default values since we don't know them in advance
			this.systemName = systemName;
			this.deviceID = deviceID;		// the CFLink deviceID of our owner device
			this.cflinkPrefix = cflinkPrefix || "CFX";	// the CFLink prefix (never changes). Default is CFX (onboard RS232 port)
			this.portNum = portNum;			// if undefined, standalone RS232 port. Otherwise, module COM port
			this.mode = (portNum == null) ? "PGM" : "232";	// default mode, RS232 for COM port and CFLink programming for onboard port
			this.baud = 115200;
			this.dataBits = 8;
			this.stopBits = 1;
			this.parity = "N";
			this.flowControl = 0;
		},

		/**
		 * Function called by the owner module / device when configuration for this port has been received
		 *  @private
		 */
		readConfig: function (device, configString) {
			// eg: PGM:115200:8:N:1:0
			var values = configString.split(":");
			if (values.length >= 6) {
				this.mode = values[0];
				this.baud = parseInt(values[1], 10);
				this.dataBits = parseInt(values[2], 10);
				this.parity = values[3];
				this.stopBits = parseInt(values[4], 10);
				this.flowControl = parseInt(values[5], 10);
				CFLink.fire(CFLink.RS232Port.CONFIGURATION_CHANGE, device, [ this ]);
			}
		},

		/**
		 * Sends a configuration update to the device after making one or more changes
		 * @private
		 */
		reconfigurePort : function () {
			CFLink.buildMsg(this.systemName, this.deviceID, "C", this.cflinkPrefix, "SPC", this.configureCommand());
		},

		/**
		 * Fires an event to indicate that serial data was received by this port
		 * @private
		 */
		serialDataReceived : function(device, data) {
			// Just fire an event to any currently registered listener
			CFLink.fire(CFLink.RS232Port.SERIAL_DATA_RECEIVED, device, [ this, data ]);
		},

		/**
		 * Set the port mode and immediately reconfigure the port
		 * @param {string} val	for built-in RS232 ports (LANBridge, CFMini): "OFF" (port OFF), "PGM" (port accepts CFLink packets) or "232" (port acts as an actual RS232 port and forwards notifications on data input). For configurable COM modules, "OFF", "232" (RS232 mode), "485H" (RS485 half-duplex) or "4XXF" (RS485 or RS422 full-duplex)
		 */
		setMode : function (val) {
			var valid = (this.portNum !== undefined) ? CFLink.RS232Port.Valid.Modes_COM.indexOf(val) : CFLink.RS232Port.Valid.Modes.indexOf(val);
			if (valid && this.mode !== val) {
				this.mode = val;
				this.reconfigurePort();
			}
		},

		/**
		 * Set the port's baudrate and immediately reconfigure the port
		 * @param {Number} val	100, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 128000, 256000
		 */
		setBaud : function (val) {
			if (CFLink.RS232Port.Valid.Bauds.indexOf(val) !== -1 && this.baud !== val) {
				this.baud = val;
				this.reconfigurePort();
			}
		},

		/**
		 * Set the port's parity setting and immediately reconfigure the port
		 * @param {string} val	"N" for none, "E" for even, "O" for odd
		 */
		setParity : function (val) {
			if (CFLink.RS232Port.Valid.Parity.indexOf(val) !== -1) {
				if (this.parity !== val) {
					this.parity = val;
					this.reconfigurePort();
				}
			} else {
				CF.log("Warning: trying to set invalid parity (" + val + ") on RS232 port of device " + this.deviceID);
			}
		},

		/**
		 * Set the number of stop bits to use and immediately reconfigure the port
		 * @param val		1 or 2 stop bits
		 */
		setStopBits : function (val) {
			if (CFLink.RS232Port.Valid.StopBits.indexOf(val) !== -1 && this.stopBits !== val) {
				this.stopBits = val;
				this.reconfigurePort();
			}
		},

		/**
		 * Set whether the port has flow control and immediately reconfigure the port
		 * @param val		0 to disable flow control, 1 to enable. True and false are also valid values
		 */
		setFlowControl : function (val) {
			var newFlowControl = val ? 1 : 0;
			if (this.flowControl !== val) {
				this.flowControl = newFlowControl;
				this.reconfigurePort();
			}
		},

		//
		// Command generator for modules - these methods prepare command strings to
		// send as part of a CFLink enveloppe
		//

		/**
		 * Returns the payload part of a CFLink packet to send data to a COM port
		 * or onboard RS232 port
		 * @param data		the data to send
		 * @return {String}	the string to insert in a CFLink packet
		 * @private
		 */
		sendDataCommand : function(data) {
			if (this.portNum == null) {
				return data;
			}
			return this.portNum + ":" + data;
		},

		/**
		 * Returns the command part of a CFLink packet to configure a COM port
		 * or onboard RS232 port. You can pass null for the parameters you do not
		 * wish to change
		 * @param mode			the mode to set (see {@link CFLink.RS232Port.Valid.Modes} or {@link CFLink.RS232Port.Valid.Modes_COM})
		 * @param baud			the port speed to set (see {@link CFLink.RS232Port.Valid.Bauds})
		 * @param dataBits		the number of data bits (7 or 8)
		 * @param parity		the parity ("N" for none, "E" for even, "O" for odd)
		 * @param stopBits		the number of stop bits (1 or 2)
		 * @param flowControl	whether to apply flow control (true or false and 1 or 0 accepted)
		 * @return {String}		returns the configuration payload for a CFLink packet
		 * @private
		 */
		configureCommand : function(mode, baud, dataBits, parity, stopBits, flowControl) {
			if (this.portNum == null) {
				// command we send when not a module
				return [
					mode || this.mode,
					baud || this.baud,
					dataBits || this.dataBits,
					parity || this.parity,
					stopBits || this.stopBits,
					flowControl || this.flowControl ].join(":");
			}
			return [
				this.portNum,
				mode || this.mode,
				baud || this.baud,
				dataBits || this.dataBits,
				parity || this.parity,
				stopBits || this.stopBits,
				flowControl || this.flowControl ].join(":");
		}
	});

// Valid values for RS232 settings
CFLink.RS232Port.Valid = {
	Modes: ["OFF", "PGM", "232"],
	Modes_COM: ["OFF", "232", "485H", "4XXF"],
	Parity: ["N", "E", "O"],
	Bauds: [100, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 128000, 256000],
	StopBits: [1, 2]
};

/**
 * Event fired when we receive information about the configuration of an RS232 port (including the
 * initial configuration)
 * Your callback function for this event should have the following prototype:
 * function(event, device, port)
 * the event parameter is the name of this event
 * the device parameter is the {@link CFLink.Device} or {@link CFLink.Module} object owning this COM/RS232 port
 * the port parameter is the {@link CFLink.RS232Port} object.
 * @type {String}
 */
CFLink.RS232Port.CONFIGURATION_CHANGE = "RS232_ConfigurationChange";

/**
 * Event fired when serial data arrives over a COM or RS232 port.
 * Your callback function for this event should have the following prototype:
 * function(event, device, port, data)
 * the event parameter is the name of this event
 * the device parameter is the {@link CFLink.Device} or {@link CFLink.Module} object owning this COM/RS232 port
 * the port parameter is the {@link CFLink.RS232Port} object.
 * the data parameter is the actual data received
 * @type {String}
 */
CFLink.RS232Port.SERIAL_DATA_RECEIVED = "RS232_SerialDataReceived";
CFLink.LANBridge = CFLink.Device.$extend(
	/**
	 * @lends CFLink.LANBridge.prototype
	 * @extends CFLink.Device
	 */
	{
		/**
		 * This object represents a CommandFusion LAN Bridge device on your CFLink bus.
		 *
		 * @constructs
		 * @protected
		 * @summary Interface to a LAN Bridge device
		 */
		__init__:function (systemName, cflinkID, dataString, doNotQuery) {
			var i, data, reqDescription = (dataString == null);
			if (reqDescription) {
				data = ["","","",""];
			} else {
				// parse data string in this format: LANBridge:<SERIAL#>:<APP_VER>:<CFLINK_VER>:<IP4>:<MAC>
				data = dataString.split(":");
			}

			// Now use the parsed contents to assign the object properties
			this.$super(systemName, "LANBridge", "LAN", cflinkID, data[1], data[2], data[3]);
			this.ipAddress = data[4];
			this.subnetMask = "255.255.255.0";
			this.gateway = null;
			this.dns = null;
			this.macAddress = data[5];
			this.DHCPEnabled = 1;
			this.slots = [];
			this.schedules = [];
			this.time = Date.now();
			this.rs232Port = new CFLink.RS232Port(systemName, cflinkID, "LAN");
			this.broadcastEnabled = 0;

			// Setup the default slots:
			// 0 = CFLink Slot
			// 1 = RS232 Slot
			// 2 = UDP Broadcasting Slot
			this.slots[0] = new CFLink.LANBridge.Slot(systemName, cflinkID, "LAN", 1, true, "cflink");
			this.slots[1] = new CFLink.LANBridge.Slot(systemName, cflinkID, "LAN", 2, true, "pgm");
			this.slots[2] = new CFLink.LANBridge.Slot(systemName, cflinkID, "LAN", 3, true, "udp", "b", "255.255.255.255", 10207);
			// Slots 3-10 Reserved for future use
			// Disable all other slots by default
			for (i = 11; i <= 20; i++) {
				this.slots[i] = new CFLink.LANBridge.Slot(systemName, cflinkID, "LAN", i, false);
			}

			// Listen for replies from LANBridge units on this ID
			CFLink.attachReplyCallbackByCFLinkID(cflinkID, this.replyData, this);

			// Get the remaining configuration settings for the LANBridge
			if (reqDescription) {
				this.send("Q","WHO","");
			}

			if (!doNotQuery) {
				// Get main config (including RS232)
				this.send("Q", "CFG", "");
				// Get time
				this.send("Q", "TME", "");
				// Get slot status (only slots 1-3 and 11-20)
				for (i = 1; i <= 20; i++) {
					if (i <= 3 || i >= 11) {
						var s = String(i);
						this.send("Q", "SLT", s);
						this.send("Q", "SUB", s);
					}
				}
			}
		},

		/**
		 * Send a CFLink packet to the device to obtain the general information about this LANBridge
		 * device (IP address, DCHP settings, etc)
		 * @instance
		 */
		getInfo:function () {
			this.send("Q", "WHO", "");
		},

		/**
		 * Override to make sure we update our ports' device ID
		 * @param id
		 * @instance
		 */
		setCFLinkID:function (id) {
			this.$super(id);
			var i, n;
			for (i = 0, n = this.slots.length; i < n; i++) {
				this.slots[i].deviceID = id;
			}
			this.rs232Port.deviceID = id;
		},

		//
		// LANBridge IP control
		//

		/**
		 * Send a DHCP mode change command to the device (effective after device resets)
		 * @param {boolean} isEnabled    true to enable DHCP, false to disable
		 * @instance
		 */
		setDHCP:function (isEnabled) {
			this.send("C", "DHC", isEnabled ? 1 : 0);
		},

		/**
		 * Send an IP address change command to the device (effective after device resets)
		 * @param ip    Full IP Address in IPv4 format, eg. 192.168.0.100
		 * @instance
		 */
		setIP:function (ip) {
			this.send("C", "IP4", ip);
		},

		/**
		 * Send a subnet mask change command to the device
		 * @param ip    Full Subnet Mask in IPv4 format, eg. 255.255.255.0
		 * @instance
		 */
		setSubnetMask:function (ip) {
			this.send("C", "SNM", ip);
		},

		/**
		 * Send an IP gateway address change command to the device.
		 * @param ip    Full IP Gateway in IPv4 format, eg. 192.168.0.1
		 * @instance
		 */
		setGateway:function (ip) {
			this.send("C", "GTW", ip);
		},

		/**
		 * Set the UDP Broadcasting Mode of the device
		 * @param {boolean} isEnabled    pass true to enable UDP Broadcasting, false to disable.
		 * @instance
		 */
		setBroadcasting:function (isEnabled) {
			this.send("C", "UDB", isEnabled ? 1 : 0);
		},

		/**
		 * Set the time of the realtime clock on board the device
		 * @param {Number} year
		 * @param {Number} month
		 * @param {Number} day Day in month
		 * @param {Number} weekday Day of the week 1-7
		 * @param {Number} hour
		 * @param {Number} minute
		 * @param {Number} second
		 * @param {Number} timezone the timezone from lookup table (1-40)
		 * @instance
		 */
		setTime:function (year, month, day, weekday, hour, minute, second, timezone) {
			this.send("C", "TME", year + ":" + month + ":" + day + ":" + weekday + ":" + hour + ":" + minute + ":" + second + ":" + timezone);
		},

		//
		// LANBridge communication slot control
		//

		/**
		 * Get a {@link CFLink.LANBridge.Slot} object for the numbered slot
		 * @param slotNumber
		 * @return {CFLink.LANBridge.Slot}
		 * @instance
		 */
		getSlot:function (slotNumber) {
			return this.slots[slotNumber];
		},

		/**
		 * Send data to the specified LANBridge communication slot.
		 * @param {Number} slotNumber    slot 1 (CFLink), 2 (RS232), 3 (UDP broadcast) or 11-20 (user-bridgeable)
		 * @param {string} data            the data to send, provided as a string (even if binary data - a string made of binary characters)
		 * @instance
		 */
		sendData:function (slotNumber, data) {
			if (slotNumber === 2) {
				// use special RS232 packet when talking to LANBridge's RS232 port
				this.send("T", "SPW", data);
			} else if (slotNumber === 1 || (slotNumber >= 11 && slotNumber <= 20)) {
				this.send("T", "SND", String(slotNumber) + ":" + data);
			}
		},

		/** @private */
		replyData:function (data, regex, me) {
			var config;
			switch (data[4]) {
				case "CFG" :
					// Device Configuration
					// eg: <IPADDRESS>:<SUBNETMASK>:<GATEWAY>:<DNS>:<DHCPMODE>:<RS232MODE>:<BAUD>:<DATABITS>:<PARITY>:<STOPBITS>:<FLOWCONTROL>:<UDPBROADCAST>:<SLOTS>
					config = data[5].split(":");
					if (config.length >= 12) {
						me.ipAddress = config[0];
						me.subnetMask = config[1];
						me.gateway = config[2];
						me.dns = config[3];
						me.DHCPEnabled = parseInt(config[4], 10);
						me.rs232Port.readConfig(me, config.slice(5, 11).join(":"));
						me.broadcastEnabled = parseInt(config[11], 10);
						me.slotsEnabled = parseInt(config[12], 10);
						CFLink.fire(CFLink.LANBridge.CONFIGURATION_CHANGE, me, []);
					}
					break;
				case "SLT" :
					// Slot configuration
					// eg: <SLOT#>:TCP:<TCPMODE>:<IPADDRESS>:<PORT>:<TIMEOUT>:<MAXCONNECTIONS>:<ECHO>
					//	 <SLOT#>:UDP:<UDPMODE>:<IPADDRESS>:<PORT>
					//	 <SLOT#>:OFF
					config = data[5].split(":");
					if (config[1] == "UDP" && config.length >= 5) {
						me.slots[config[0]].readConfig(me, config[1], config[2], config[3], config[4]);
					}
					else if (config[1] == "TCP" && config.length >= 8) {
						me.slots[config[0]].readConfig(me, config[1], config[2], config[3], config[4], config[5], config[6], config[7]);
					}
					else if (config[1] == "OFF" && config.length >= 2) {
						me.slots[config[0]].readConfig(me, config[1]);
					}
					break;
				case "SUB" :
					// Slot Subscription Configuration
					// eg: <SLOTA>:<SLOTB>:<CFLINKID>:<MODULE>:<TXCOMMANDNAME>:<RXCOMMANDNAME>
					// Can also only return parts of the subscription if defined without CFLink params
					// eg: <SLOTA>:<SLOTB>:<CFLINKID>
					// eg: <SLOTA>:<SLOTB>
					config = data[5].split(":");
					var theSub = me.slots[config[0]].subscription;
					theSub.targetSlot = config[1];
					theSub.cflinkID = config[2];
					theSub.module = config[3];
					theSub.txCommandName = config[4];
					theSub.rxCommandName = config[5];
					break;
				case "UDB":
					// UDP Broadcasting config
					var udb = parseInt(data[5], 10);
					if (udb !== me.broadcastEnabled) {
						me.broadcastEnabled = udb;
						CFLink.fire(CFLink.LANBridge.CONFIGURATION_CHANGE, this, []);
					}
					break;
				case "SPC":
					// Serial port configuration reply
					me.rs232Port.readConfig(me, data[5]);
					break;
				case "WHO":
					config = data[5].split(':');
					me.serial = config[1];
					me.firmwareVer = config[2];
					me.protocolVer = config[3];
					me.ipAddress = config[4];
					me.macAddress = config[5];
					CFLink.fire(CFLink.Device.INFO_RECEIVED, me, [ ]);
					break;
				default:
					this.$super(data, regex, me);
					break;
			}
		}
	});

CFLink.LANBridge.Slot = Class.$extend(
	/**
	 * @lends CFLink.LANBridge.Slot
	 * @description this is a class description
	 */
	{
		/**
		 * A Slot object is the JavaScript interface with a single communication slot on a LAN Bridge device
		 *
		 * <br><br>
		 * <b>Do not create this object directly</b>. You can obtain instances of this class using the
		 * {@link CFLink.LANBridge.getSlot} function.
		 *
		 * @summary A slot represents a single communication (routing) slot on a LAN Bridge device
		 * @constructs
		 * @protected
		 */
		__init__:function (systemName, deviceID, devicePrefix, slotNum, enabled, type, modeType, ipAddress, port, timeout, maxConn, echo) {
			// required params
			this.systemName = systemName;
			this.deviceID = deviceID;
			this.cflinkPrefix = devicePrefix;	// this never changes
			this.slotNum = padBeginning(2, "0", String(slotNum));

			// optional params
			this.enabled = enabled || true;
			this.type = type || "OFF";
			this.mode = modeType || "";
			this.ipAddress = ipAddress || "0.0.0.0";
			this.port = port || 0;
			this.timeout = timeout || 0;
			this.maxConnections = maxConn || 0;
			this.echo = echo || false;
			this.subscription = {
				targetSlot:undefined,
				cflinkID:undefined,
				module:undefined,
				txCommandName:undefined,
				rxCommandName:undefined
			};
		},

		/** @private */
		readConfig:function (device, type, modeType, ipAddress, port, timeout, maxConnections, echo) {
			var change = (this.type !== type);
			this.type = type;
			if (this.mode !== "OFF") {
				change |= (this.mode !== modeType || this.ipAddress !== ipAddress || this.port !== port || this.enabled !== true);
				this.enabled = true;
				this.mode = modeType;
				this.ipAddress = ipAddress;
				this.port = port;
				if (type === "TCP") {
					// TCP mode has some more properties we need to save
					change |= (this.timeout !== timeout || this.maxConnections !== maxConnections || this.echo !== echo);
					this.timeout = timeout;
					this.maxConnections = maxConnections;
					this.echo = echo;
				}
			} else {
				change = (this.enabled !== false);
				this.enabled = false;
			}
			if (change) {
				CFLink.fire(CFLink.LANBridge.Slot.CONFIGURATION_CHANGE, device, [ this ]);
			}
		},

		/**
		 * Configure this slot for TCP communications. The configuration command is being sent immediately to the device's slot,
		 * but the changes won't be effective until the device is reset (therefore, we don't update the properties of this
		 * JavaScript object immediately)
		 *
		 * @param mode {string} "S" for TCP server slot, "C" for TCP client slot
		 * @param ipAddress {string} for TCP servers slots, "0.0.0.0" to allow any client to connect or the IP address of the only allowed client. For TCP client slots, the IP address of the remote to connect to.
		 * @param port {Number} the TCP port number to assign to the slot
		 * @param timeout {Number} The time in seconds to hold a TCP connection open for without any data transmissions. Set to 0 to disable.
		 * @param maxConnections {Number} The maximum number of simultaneous connections a TCP Server slot can handle. Set to 0 for unlimited
		 * @param echo {Number} Option to echo data received on a TCP Server slot from any TCP Client to all other connected clients. 1 to enable, 0 to disable. Ignored for TCP Client slots.
		 * @instance
		 */
		configureForTCP:function (mode, ipAddress, port, timeout, maxConnections, echo) {
			var msg = padBeginning(2, "0", String(this.slotNum)) +
				":" + mode +
				":" + ipAddress +
				":" + port +
				":" + timeout +
				":" + maxConnections +
				":" + ((echo === 0 || echo === false) ? "1" : "0");
			CFLink.buildMsg(this.systemName, this.deviceID, "C", this.cflinkPrefix, "SLT", msg);
		},

		/**
		 * Configure this slot for UDP communications. The configuration command is being sent immediately to the device's slot,
		 * but the changes won't be effective until the device is reset (therefore, we don't update the properties of this
		 * JavaScript object immediately)
		 *
		 * @param mode {string} "U" for unicast UDP, "M" for multicast, "B" for broadcast
		 * @param ipAddress    the IP address to set for this
		 * @param port the port on the remote
		 * @instance
		 */
		configureForUDP:function (mode, ipAddress, port) {
			var msg = [ padBeginning(2, "0", String(this.slotNum)), mode, ipAddress, port ].join(":");
			CFLink.buildMsg(this.systemName, this.deviceID, "C", this.cflinkPrefix, "SLU", msg);
		},

		/**
		 * Disable this slot. The configuration command is being sent immediately to the device's slot,
		 * but the changes won't be effective until the device is reset (therefore, we don't update the properties of this
		 * JavaScript object immediately)
		 *
		 * @instance
		 */
		disableSlot:function () {
			CFLink.buildMsg(this.systemName, this.deviceID, "C", this.cflinkPrefix, "SLO", "");
		},

		//
		// Slot subscription management
		//

		/**
		 * Unsubscribe a slot from any subscription it previously had
		 * @instance
		 */
		unbridge:function () {
			var slot = this.slotNum;
			if (!(slot === 2 || (slot >= 11 && slot <= 20))) {
				CFLink.buildMsg(this.systemName, this.deviceID, "C", this.cflinkPrefix, "SUB", slot + ":0");
			} else if (CF.debug) {
				// this is not allow, log a message to warn the programmer
				CF.log("Disallowed change: trying to unsubscribe slot " + slotNumber + " of device ID " + this.deviceID);
			}
		},

		/**
		 * Bridge this slot to another slot. You can setup bridges for slots 2 (RS232) and 11 - 20 only
		 * Changes are effective after a device reset.
		 * @param {Number} targetSlot The slot to forward data to/from. Numbers 1,2,11-20 only.
		 * @param {string} targetDevice if targetSlot is 1 (LANBridge's CFLink slot), only messages from the specified device's CFLinkID will be forwarded
		 * @param {string} targetModule if targetSlot is 1 (LANBridge's CFLink slot) and targetDevice not empty and addresses a CFLink device that contains modules, targetModule is the module we're bridging to within the targetDevice
		 * @param outgoingWrapperCommand {string} if targetSlot is 1 (LANBridge's CFLink slot), you can set a 7 char CFLink wrapper command that will be used to wrap all data sent from this slot to the other slot, effectively turning raw data into valid CFLink packets
		 * @param incomingCommandFilter {string} if targetSlot is 1 (LANBridge's CFLink slot), you can set a 7 char CFLink command filter that will filter out all packets coming from the target slot, AND unwrapping the payload, effectively extracting raw data from incoming CFLink packets
		 * @instance
		 */
		bridge:function (targetSlot, targetDevice, targetModule, outgoingWrapperCommand, incomingCommandFilter) {
			if (targetSlot != null) {
				var msg = [ this.slotNum, targetSlot, targetDevice, targetModule, outgoingWrapperCommand, incomingCommandFilter ].join(":");
				CFLink.buildMsg(this.systemName, this.deviceID, "C", this.cflinkPrefix, "SUB", msg);
			} else {
				CF.log("Error: invalid target slot while bridging slot " + this.slotNum + " of device " + this.deviceID);
			}
		}

	});

/**
 * This event is being sent when a communication slot's configuration on the LANBridge
 * changes. Your callback function should have the prototype:
 * function(event, sender, commSlot)
 * event is the name of this event
 * sender is the {@link CFLink.LANBridge} object that owns this {@link CFLink.LANBridge.Slot}
 * commSlot is is the {@link CFLink.LANBridge.Slot} object itself
 * @constant
 */
CFLink.LANBridge.Slot.CONFIGURATION_CHANGE = "CommSlot_ConfigChange";

/**
 * This event is being sent when the LANBridge's device configuration changes
 * (upon receiving the CFG message). Your callback function should have the prototype:
 * function(event, sender)
 * event is the name of this event
 * sender is the LANBridge object
 * @constant
 * @type {String}
 */
CFLink.LANBridge.CONFIGURATION_CHANGE = "LANBridge_ConfigChange";
CFLink.DINMOD4 = CFLink.Device.$extend(
	/**
	 * @lends CFLink.DINMOD4.prototype
	 * @extends CFLink.Device
	 */
	{
		/**
		 * This object is the JavaScript interface to a CommandFusion DIN-MOD4 device. It inherits the functions
		 * and properties of {@link CFLink.Device}. A DIN-MOD4 is a modular unit that also has a couple onboard ports
		 * (RS-232, single digital input)
		 *
		 * To access the onboard RS232, you'll use the {@link CFLink.Device.configureCOMPort}, {@link CFLink.Device.sendCOMData}
		 * and {@link CFLink.Device.watchCOMPort} functions.
		 *
		 * You can monitor the digital input port by calling {@link CFLink.DINMOD4.watchOnboardDigitalInput}.
		 *
		 * @summary Interface to DIN-MOD4 devices
		 *
		 * @protected
		 * @constructs
		 */
		__init__: function(systemName, id, dataString) {
			// onboard RS232 port
			this.rs232Port = new CFLink.RS232Port(systemName, id, "MOD");
			this.digitalInput = new CFLink.IOPort(this, 1, CFLink.IOPort.Mode.DRY_CONTACT, 0, 0);
			this.modules = [null, null, null, null];

			// Now use the parsed contents to assign the object properties
			var data, moduleData;
			if (dataString == null) {
				moduleData = [];
				data = ["","","",""];
			} else {
				// DIN-MOD4:<SERIAL#>:<APP_VER>:<CFLINK_VER>,M1:<MODULE1_NAME>,M2:<MODULE2_NAME>,M3:<MODULE3_NAME>,M4:<MODULE4_NAME>
				moduleData = dataString.split(",");
				data = (moduleData.length > 0) ? moduleData[0].split(":") : ["","","",""];
			}

			this.$super(systemName, "DIN-MOD4", "MOD", id, data[1], data[2], data[3]);

			this._instantiateModules(moduleData);

			// Listen for replies from this CFLink ID
			CFLink.attachReplyCallbackByCFLinkID(id, this.replyData, this);

			// If device was manually created, query for characteristics now
			if (dataString == null || data[1] === "") {
				this.send("Q","WHO","");
			}
			this.queryConfig();
		},

		/**
		 * Obtain the {@link CFLink.Module} object that represents a module inserted in one of the slots
		 * of the DIN-MOD4 device. If there is no module inserted in this slot, or if the list of inserted
		 * modules is not yet known, this function returns null.
		 *
		 * Once you have a {@link CFLink.Module} object, you can use the object to talk to the module itself,
		 * get or set the ports, configure it, etc.
		 *
		 * @param {Number} slotNumber the slot number in the DIN-MOD4 unit (1-4). Slot 1 is the one on the left, at the same level as the CFLink ID indicator.
		 * @returns {CFLink.Module} a module object, or null
		 */
		getModule: function(slotNumber) {
			if (slotNumber >= 1 && slotNumber <= this.modules.length) {
				return this.modules[slotNumber - 1];
			}
			return null;
		},

		/** @private */
		_makeModule: function(model,commandPrefix,slot,numIO,numCOM,numIR,numRelays) {
			// if there was an existing module, check whether it was the right type. If yes,
			// keep it. Otherwise, log a message and replace the old module.
			var old = this.modules[slot - 1];
			if (old != null) {
				if (old.model == model) {
					if (CF.debug) {
						CF.log("Auto-instantiated module " + model + " in DIN-MOD4 " + this.cflinkID + " slot " + slot + " was found.")
					}
					return old;
				}
				if (CF.debug) {
					CF.log("Warning: module in DIN-MOD4 ID " + this.cflinkID + " expected to be " + old.model + ", but actually found a " + model + ".");
				}
			}
			return new CFLink.Module(this, model, commandPrefix, slot, numIO, numCOM, numIR, numRelays);
		},

		/** @private */
		_instantiateModules: function(moduleData) {
			// Now setup the module data
			for (var i = 1; i < moduleData.length; i++) {
				var thisModule = moduleData[i].split(":");
				var slot = parseInt(thisModule[0].charAt(1), 10);
				var newModule = this.modules[slot - 1];
				switch (thisModule[1]) {
					case "MOD-IR8":
						newModule = this._makeModule("IR8", "IRX", slot, 0, 0, 8, 0);
						break;
					case "MOD-IO8":
						newModule = this._makeModule("IO8", "IOX", slot, 8, 0, 0, 0);
						break;
					case "MOD-COM4":
						newModule = this._makeModule("COM4", "COM", slot, 0, 4, 0, 0);
						break;
					case "MOD-LRY8":
						newModule = this._makeModule("LRY8", "RLY", slot, 0, 0, 0, 8);
						break;
					case "MOD-SSRY4":
						newModule = this._makeModule("SSRY4", "RLY", slot, 0, 0, 0, 4);
						break;
					case "MOD-RY4":
						newModule = this._makeModule("RY4", "RLY", slot, 0, 0, 0, 4);
						break;
					case "MOD-HRY2":
						newModule = this._makeModule("HRY2", "RLY", slot, 0, 0, 0, 2);
						break;
				}
				if (newModule != null) {
					// Add the new device to the list of cflink devices
					this.modules[slot - 1] = newModule;
					newModule.queryConfig();
				}
			}
		},

		/** @private */
		queryConfig:function () {
			// Query serial port configuration
			this.send("Q","SPC","");

			// Query status of the onboard digital input
			// TODO: find the appropriate command
			//this.send("Q","STA","");
		},

		/** @private */
		_handleModuleMessage: function(target, command, payload, me) {
			if (payload != null && payload.length && payload.charAt(0) === 'M') {
				var slot = parseInt(payload.charAt(1), 10);
				if (slot > 0 && slot <= me.modules.length) {
					var module = me.modules[slot - 1];
					if (module !== undefined) {
						module.handleMessage(target, command, payload, me);
					}
				}
			}
		},

		/** @private */
		replyData:function (data, regex, me) {
			var ports, i;
			switch (data[3]) {
				case "MOD":
					switch (data[4]) {
						case "CHA":
						case "STA":
							// status or change of the onboard digital input
							ports = data[5].split(":");
							if (ports.length === 2 && ports[0] === "P01") {
								me.digitalInput.portValueChanged(me, CFLink.IOPort.Mode.DRY_CONTACT, parseInt(ports[1], 10));
							}
							break;

						case "WHO":
							me._instantiateModules(data[5].split(","));
							this.$super(data, regex, me);
							break;

						default:
							this.$super(data, regex, me);
							break;
					}
					break;

				case "IOX":
				case "COM":
				case "IRX":
					// route messages going to the modules
					me._handleModuleMessage(data[3], data[4], data[5], me);
					break;

				case "RLY":
					// special handling as RRLYSTA may concern multiple modules. Send reply to each module
					// instance separately
					var array = data[5].split(",");
					for (i=0; i < array.length; i++) {
						me._handleModuleMessage(data[3], data[4], array[i], me);
					}
					break;

				default:
					this.$super(data, regex, me);
					break;
			}
		},

		//
		// Onboard digital input support
		//

		/**
		 * Get the current state of the onboard digital input (the one located at the back of
		 * the DIN-MOD4 unit)
		 *
		 * @return {Number} 1 if closed (pushed), 0 if open (released), -1 if not known yet
		 */
		getDigitalInputState: function () {
			return this.digitalInput.state;
		},

		/**
		 * Setup a callback function that is called when the state of the selected IO port(s) change
		 * This is a simple helper that watches the {@link CFLink.IOPort.VALUE_CHANGE} event and only calls you back
		 * when one of the I/O ports you want to watch changes state.
		 *
		 * Your callback function should be of the form:
		 *
		 * myCallback(cfminiObject, portNumber, previousValue, newValue)
		 *
		 * Where `cfminiObject' is the {@link CFLink.CFMini} device object, `portNumber' is the I/O port number
		 * that changed state, `previousValue' is the previous value of this I/O port, and `newValue' is its
		 * new value. Note that when we get the initial value of the I/O port (at initialization time), the `previousValue'
		 * parameter will be -1.
		 *
		 * @param {Function} callback    your callback function, of the form callback(dinmod4_object, portNumber, value)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {Number} a watcherID you can use to unwatch with {@link CFLink.unwatch} or {@link CFLink.DINMOD4.unwatch} (both are equivalent)
		 */
		watchOnboardDigitalInput: function(callback, me) {
			return CFLink.watch(CFLink.IOPort.VALUE_CHANGE, this, function (evt, sender, portObject, previousValue, newValue) {
				if (portObject == this.digitalInput) {
					callback.apply(me, [this, portObject.portNumber, previousValue, newValue]);
				}
			}, this);
		},

		/**
		 * Stop watching the changes you asked to be notified for in {@link CFLink.DINMOD4.watchOnboardDigitalInput}
		 * You could as well call {@link CFLink.unwatch} which does the same thing.
		 *
		 * @param {Number} watcherID the watcher ID that was returned by {@link CFLink.DINMOD4.watchOnboardDigitalInput}
		 */
		unwatch:function (watcherID) {
			CFLink.unwatch(watcherID);
		}
	});
CFLink.CFMini = CFLink.Device.$extend(
	/**
	 * @lends CFLink.CFMini.prototype
	 */
	{
		/**
		 * This object is the JavaScript interface to a CommandFusion CFMini device. It inherits the functions
		 * and properties of {@link CFLink.Device}.
		 *
		 * If the object was built from a predefined structure (not by discovery) we may not have the description string
		 * at end, therefore can't extract the serial#, firmware and cflink version. This is not an
		 * issue when using the CFMini.
		 *
		 * To create a {@link CFLink.CFMini} object, you should use the {@link CFLink.getDevices}
		 * function as per the example below.
		 *
		 * @param {string} systemName	name of the external system we use to tap the lanbridge this device is connected to
		 * @param {string} id			CFLink ID of the device
		 * @param {string} dataString	device description string as received during discovery. This is optional: if the device
		 * 								was created without having been found during discovery, pass null or nothing and the object will query the information
		 * 							 	it needs directly from the device.
		 *
		 * @summary Interface to CFMini devices
		 *
		 * @constructs
		 * @protected
		 * @example
		 *
		 * // Obtain a CFMini object. We'll be talking to it through the external system named "CFLink".
		 * // The CFMini device has CFLink ID 12.
		 * var mini = CFLink.getDevice("CFLINK", CFLink.model.CFMini, "12");
		 *
		 * // Now we can start using CFMini. For example, close relay number 1
		 * mini.setRelayState(1, 1);
		 *
		 */
		__init__ : function (systemName, id, dataString) {
			var i, data, reqDescription = (dataString == null);
			if (reqDescription) {
				data = ["","","",""];
			} else {
				// parse data string in this format: CFMini:<SERIAL#>:<APP_VER>:<CFLINK_VER>
				data = dataString.split(":");
			}

			// Now use the parsed contents to assign the object properties
			this.$super(systemName, "CFMini", "MIN", id, data[1], data[2], data[3]);

			// onboard RS232 port
			this.rs232Port = new CFLink.RS232Port(systemName, id, "MIN");
			this.IOEnabled = 1;
			this.IOReportOnChange = 1;
			this.IOReportInterval = 0;
			this.IOPorts = [];
			this.Relays = [];
			this.IRPorts = [];
			for (i = 1; i <= 4; i++) {
				this.IOPorts.push(new CFLink.IOPort(this, i));
			}
			for (i = 1; i <= 4; i++) {
				this.Relays.push(new CFLink.RelayPort(this, i));
			}
			for (i = 1; i <= 8; i++) {
				// TODO: proper creation of IR ports
				this.IRPorts.push(new CFLink.IOPort(this, i));
			}

			// Listen for replies from CFMini units on this ID
			CFLink.attachReplyCallbackByCFLinkID(id, this.replyData, this);

			// Get the remaining configuration settings
			if (reqDescription) {
				this.send("Q","WHO","");
			}
			// Get RS232 config
			this.send("Q", "SPC", "");
			// Get IO config
			CFLink.buildMsg(this.systemName, this.cflinkID, "Q", "IOX", "CFG", "");
			// Get IO port config
			CFLink.buildMsg(this.systemName, this.cflinkID, "Q", "IOX", "PRT", "");
			// Get IO port status
			CFLink.buildMsg(this.systemName, this.cflinkID, "Q", "IOX", "STA", "");
			// Get Relay status
			CFLink.buildMsg(this.systemName, this.cflinkID, "Q", "RLY", "STA", "");
			// Get Relay power-on status
			CFLink.buildMsg(this.systemName, this.cflinkID, "Q", "RLY", "POS", "");
		},

		/**
		 * Obtain the underlying {@link CFLink.IOPort} object associated with one of CFMini's IO ports (1-4)
		 * You should seldom need to call this function.
		 * @param {number} index	index of the IO port (1-4)
		 * @return {CFLink.IOPort} 	an IOPort object
		 * @instance
		 */
		getIOPort : function(index) {
			return this.IOPorts[index - 1];
		},

		/**
		 * Internal function that uses methods from the individual ports classes to generate commands
		 * target is "IOX" (I/O ports), "RLY" (Relay ports) or "IRX" (IR ports).
		 * Index is number or array of numbers
		 * @private
		 */
		_sendPortCommand: function (target, command, index, commandFunction, params, commandType) {
			var msg, o, ports;
			if (commandType === undefined) {
				commandType = "T";	// by default, this is a "transmit"
			}
			switch(target) {
				case "IOX":
					ports = this.IOPorts;
					break;
				case "RLY":
					ports = this.Relays;
					break;
				case "IRX":
					ports = this.IRPorts;
					break;
			}
			if (index instanceof Array) {
				var i, n = index.length, l;
				msg = "";
				for (i = 0; i < n; i++) {
					l = index[i];
					if (CF.debug && (l < 1 || l > ports.length)) {
						CF.log("Warning: CFMini " + target + " port number " + l + " is not in the range 1-" + ports.length);
						continue;
					}
					o = ports[l-1];
					if (i > 0)
						msg = msg + "|" + o[commandFunction].apply(o, params);
					else
						msg = o[commandFunction].apply(o, params);
				}
				this.send(commandType, command, msg, target);
			} else {
				if (CF.debug && (index < 1 || index > ports.length)) {
					CF.log("Warning: " + this.model + " " + target + " port number " + index + " is not in the range 1-" + ports.length);
					return;
				}
				o = ports[index-1];
				this.send(commandType, command, o[commandFunction].apply(o, params), target);
			}
		},

		/** @private */
		_checkValid: function (array, type, index, caller) {
			if (index instanceof Array) {
				for (var i=0; i < index.length; i++) {
					if (!this._checkValid(array, index[i], caller)) {
						return false;
					}
				}
			}
			if (index < 1 || index > array.length) {
				CF.log("Warning: " + this.model + "." + caller + ": invalid " + type + " index:" + index);
				return false;
			}
			return true;
		},

		/**
		 * Configure CFMini behavior for I/O ports: enable or disable them altogether,
		 * determine whether they should report state change, and if yes, if they should
		 * send regular state change messages through the `reportInterval' parameter.
		 *
		 * @param {Boolean} enabled			pass 1 or true to enable I/O ports
		 * @param {Number} reportOnChange	pass 1 or true if I/O ports should report changes. Changes are reported on the CFLink bus through 'CHA' messages.
		 * 							You can catch I/O port value changes by watching the {@link CFLink.IOPort.VALUE_CHANGE} event,
		 * 							or using the {@link CFLink.CFMini.watchIOPorts} function.
		 * @param {Number} reportInterval	If reportOnChange enables change reporting, you can request that changes be reported at regular intervals,
		 * 							in 0.1s increments. Pass 0 to get change reports only when an actuall change occurs.
		 * 							Pass a positive value to have regular value reports posted on the bus.
		 * 							Note tat the {@link CFLink.IOPort.VALUE_CHANGE} event and the {@link CFLink.CFMini.watchIOPorts} function
		 * 							will trigger only when an actual change is seen (but the messages still flow on the bus,
		 * 							so they can be used to trigger automated actions by the use of Rules in other devices).
		 */
		configureInputOutputs : function(enabled, reportOnChange, reportInterval) {
			var e = (enabled || false) ? 1 : 0;
			var r = (reportOnChange || false) ? 1 : 0;
			var i = Math.floor(Math.max(0, Math.min(reportInterval, 99999)));
			CFLink.buildMsg(this.systemName, this.cflinkID, "C", "IOX", "CFG", e + ":" + r + ":" + i);
		},

		//
		// I/O ports
		//

		/** @private */
		_checkValidIO : function (index, caller) {
			if (index < 1 || index > this.IOPorts.length) {
				CF.log("Warning: CFMini " + caller + ": invalid I/O port index (" + index + ")");
				return false;
			}
			return true;
		},

		/** @private */
		_checkOutputIO : function (index, caller) {
			var port = this.IOPorts[index - 1];
			if (port.mode !== CFLink.IOPort.Mode.RELAY_CONTROL_OUTPUT && port.mode !== CFLink.IOPort.Mode.LED_OUTPUT) {
				CF.log("Warning: CFMini " + caller + ": port " + index + " is not configured for output");
				return false;
			}
			return true;
		},

		/**
		 * Configure an I/O port to set its operating mode, as well as minimum change value and power-on state
		 * (when applicable, depends on the chosen mode). Note that the command is being sent to the device, but
		 * the known values of the JavaScript representation of the port will stay the same until we receive
		 * the acknowledge from the device.
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to configure multiple
		 * I/O ports at once.
		 *
		 * @param {Number, Array} index		the I/O port index (1-4) or an array of I/O port indices
		 * @param {CFLink.IOPort.Mode} mode		the mode to set for this I/O port
		 * @param {Number} minChange			for I/O ports that are set to digital input mode, the minimum expected change (voltage or resistance) to trigger a state change.
		 * 										Pass 0 to disable change reporting for this port altogether
		 * 										(remember that you can enable and disable change reporting globally using {@link CFLink.CFMini.configureInputOutputs}).
		 * @param powerOnState
		 */
		configureIOPort : function (index, mode, minChange, powerOnState) {
			if (this._checkValidIO(index, "configureIOPort")) {
				this._sendPortCommand("IOX", "PRT", index, "configureCommand", [ mode, minChange, powerOnState ], "C");
			}
		},

		/**
		 * For IO ports configured as external relay control output or LED output,
		 * set the value (0 = open for relays, off for LEDs - 1 = closed for relays, on for LEDs)
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to set the value of multiple
		 * I/O ports at once.
		 *
		 * @param {Number, Array} index		the I/O port index (1-4) or an array of I/O port indices
		 * @param {Number} value	the new value of the output port (0 or 1)
		 * @instance
		 */
		setIOPortValue : function (index, value) {
			if (this._checkValidIO(index, "setIOPortValue") && this._checkOutputIO(index, "setIOPortValue")) {
				this._sendPortCommand("IOX", "SET", index, "setCommand", [ (value === true || value === 1 || value === "1") ]);
			}
		},

		/**
		 * For IO ports configured as external relay control output or LED output,
		 * toggle (invert) the current state. This command is invalid when the I/O port is not in relay control output
		 * or LED output mode.
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to set the value of multiple
		 * I/O ports at once.
		 *
		 * @param {Number, Array} index		the I/O port index (1-4) or an array of I/O port indices
		 * @instance
		 */
		toggleIOPortValue : function (index) {
			if (this._checkValidIO(index, "toggleIOPortValue") && this._checkOutputIO(index, "toggleIOPortValue")) {
				this._sendPortCommand("IOX", "SET", index, "toggleCommand", [ ]);
			}
		},

		/**
		 * Setup a callback function that is called when the state of the selected IO port(s) change
		 * This is a simple helper that watches the {@link CFLink.IOPort.VALUE_CHANGE} event and only calls you back
		 * when one of the I/O ports you want to watch changes state.
		 *
		 * Your callback function should be of the form:
		 *
		 * myCallback(cfminiObject, portNumber, previousValue, newValue)
		 *
		 * Where `cfminiObject' is the {@link CFLink.CFMini} device object, `portNumber' is the I/O port number
		 * that changed state, `previousValue' is the previous value of this I/O port, and `newValue' is its
		 * new value. Note that when we get the initial value of the I/O port (at initialization time), the `previousValue'
		 * parameter will be -1.
		 *
		 * @param {Array} portNumbers       an array of the port numbers to watch. Pass `null' to watch all ports
		 * @param {Function} callback    your callback function, of the form callback(cfmini_object, portNumber, value)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {Number} a watcherID you can use to unwatch with {@link CFLink.unwatch} or {@link CFLink.CFMini.unwatch} (both are equivalent)
		 */
		watchIOPorts: function(portNumbers, callback, me) {
			if (!(portNumbers instanceof Array)) {
				portNumbers = [ portNumbers ];			// fix programmer mistakes
			}
			return CFLink.watch(CFLink.IOPort.VALUE_CHANGE, this, function (evt, sender, portObject, previousValue, newValue) {
				if (this.IOPorts.indexOf(portObject) != -1 && (portNumbers[0] == null || portNumbers.indexOf(portObject.portNumber) != -1)) {
					callback.apply(me, [this, portObject.portNumber, previousValue, newValue]);
				}
			}, this);
		},

		/**
		 * Stop watching the changes you asked to be notified for in {@link CFLink.CFMini.watchIOPorts} and
		 * {@link CFLink.CFMini.watchRelays}.
		 * You could as well call {@link CFLink.unwatch} which does the same thing.
		 * @param {Number} watcherID the watcher ID that was returned by {@link CFLink.CFMini.watchIOPorts} or {@link CFLink.CFMini.watchRelays}
		 */
		unwatch:function (watcherID) {
			CFLink.unwatch(watcherID);
		},

		//
		// Relays
		//

		/** @private */
		_checkValidRelay : function (index, caller) {
			if (index < 1 || index > this.Relays.length) {
				CF.log("Warning: CFMini " + caller + ": invalid relay index (" + index + ")");
				return false;
			}
			return true;
		},

		/**
		 * Obtain the underlying {@link CFLink.IOPort} object associated with one of CFMini's Relay ports (1-4)
		 * You should seldom need to call this function.
		 * @param {number} index	index of the Relay port (1-4)
		 * @return {CFLink.IOPort} 	an IOPort object. Use at your own risk, don't modify it.
		 * @instance
		 */
		getRelayPort : function(index) {
			return this.Relays[index - 1];
		},

		/**
		 * Set the state of one of the relay ports of this CFMini.
		 *
		 * <br><br>
		 * You can pass a single port number, or
		 * an array of port numbers to set to the same state (for example, to open or close multiple
		 * relays at once)
		 *
		 * @param {Number,Array} index	the relay index (1-4) or an array of relay indices
		 * @param {Number} state	the new state (0=open, 1=closed)
		 * @instance
		 */
		setRelayState : function (index, state) {
			if (this._checkValidRelay(index, "setRelayState")) {
				this._sendPortCommand("RLY", "SET", index, "setCommand", [ (state === true || state === 1 || state === "1") ]);
			}
		},

		/**
		 * Toggle the state of one of the relay ports of this CFMini.
		 *
		 * <br><br>
		 * You can pass a single port number, or
		 * an array of port numbers to set to the same state (for example, to open or close multiple
		 * relays at once)
		 *
		 * @param {Number,Array} index	the relay index (1-4) or an array of relay indices
		 * @instance
		 */
		toggleRelayState : function (index) {
			if (this._checkValidRelay(index, "toggleRelayState")) {
				this._sendPortCommand("RLY", "SET", index, "toggleCommand", [ ]);
			}
		},

		/**
		 * Pulse one of the relay ports of this CFMini (close it for the specified duration then open)
		 * If the relay was already closed, it will open at the end of the pulse duration
		 *
		 * <br><br>
		 * You can pass a single port number, or an array of port numbers to pulse multiple relays at once
		 *
		 * @param {Number, Array} index		the relay index (1-4) or an array of relay indices
		 * @param {Number} duration	the duration. An integer that represent a number of 1/10s. For example, the value 10 represents 1 second.
		 * @instance
		 */
		pulseRelayState : function (index, duration) {
			if (this._checkValidRelay(index, "pulseRelayState")) {
				this._sendPortCommand("RLY", "SET", index, "pulseCommand", [ duration ]);
			}
		},

		/**
		 * Obtain the actual state of one of the relay ports of this CFMini. The state this function returns
		 * is the last known state, as received on the CFLink bus. We don't requery the device (this would require
		 * an asynchronous callback).
		 *
		 * @param {Number} index the index (1-4) of the relay you want to get the last known state of.
		 * @return {Number} 0 if the relay is open, 1 if it is closed.
		 */
		getRelayState : function (index) {
			if (this._checkValidRelay(index, "getRelayState")) {
				return this.Relays[index-1].state;
			}
			return 0;
		},

		/**
		 * Setup a callback function that is called when the state of the selected Relay port(s) change
		 * This is a simple helper that watches the {@link CFLink.IOPort.VALUE_CHANGE} event and only calls you back
		 * when one of the Relay ports you want to watch changes state.
		 *
		 * Your callback function should be of the form:
		 *
		 * myCallback(cfminiObject, portNumber, previousValue, newValue)
		 *
		 * Where `cfminiObject' is the {@link CFLink.CFMini} device object, `portNumber' is the Relay port number
		 * that changed state, `previousValue' is the previous value of this Relay port (0 or 1), and `newValue' is its
		 * new value. Note that when we get the initial value of the relay (at initialization time), the `previousValue'
		 * parameter will be -1.
		 *
		 * @param {Array} portNumbers    an array of the relay port numbers to watch (relays are numbered from 1 to 4). Pass `null' to watch all relays. Passing a single port number is also accepted.
		 * @param {Function} callback    your callback function, of the form callback(cfmini_object, portNumber, value)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {Number} a watcherID you can use to unwatch with {@link CFLink.CFMini.unwatch}
		 */
		watchRelays : function(portNumbers, callback, me) {
			if (!(portNumbers instanceof Array)) {
				portNumbers = [ portNumbers ];			// fix programmer mistakes
			}
			return CFLink.watch(CFLink.IOPort.VALUE_CHANGE, this, function (evt, sender, portObject, previousState, newState) {
				if ((portObject instanceof CFLink.RelayPort) && (portNumbers[0] == null || portNumbers.indexOf(portObject.portNumber) != -1)) {
					callback.apply(me, [this, portObject.portNumber, previousState, newState]);
				}
			}, this);
		},

		/** @private */
		replyData : function (data, regex, me) {
			var i, n, values, portNum;
			switch (data[4]) {
				case "SPC":
					// Serial Port Configuration eg: PGM:115200:8:N:1:0
					me.rs232Port.readConfig(me, data[5]);
					break;

				case "CFG":
					// IO Configuration
					// eg: MM:1:1:0
					values = data[5].split(":");
					if (values.length >= 4) {
						var ioEnabled = parseInt(values[1], 10);
						var reportOnChange = parseInt(values[2], 10);
						var reportInterval = parseInt(values[3], 10);
						if (me.IOEnabled !== ioEnabled || me.IOReportOnChange !== reportOnChange || me.IOReportInterval !== reportInterval) {
							me.IOEnabled = ioEnabled;
							me.IOReportOnChange = reportOnChange;
							me.IOReportInterval = reportInterval;
							CFLink.fire(CFLink.CFMini.CONFIGURATION_CHANGE, me, []);
						}
					}
					break;

				case "PRT":
					// IO Port Configuration
					// eg: MM|P01:L:0:0|P02:D:0:0|P03:V:0:0|P04:R:0:0
					values = data[5].split("|");
					n = values.length;
					if (n >= 5) {
						for (i = 0; i < n; i++) {
							var portConfig = values[i].split(":");
							if (portConfig.length >= 4) {
								// the setConfiguration call takes care of firing a config change event if needed
								portNum = parseInt(portConfig[0].substring(1), 10);
								if (portNum > 0 && portNum <= me.IOPorts.length) {
									me.IOPorts[portNum - 1].portConfigurationReceived(me, portConfig[1], portConfig[2], portConfig[3]);
								}
							}
						}
					}
					break;

				case "STA":				// Relay and I/O port status reply
				case "CHA":				// I/O port change report
					// eg: MM|P01:D:0:0|P02:D:0:0|P03:D:0:0|P04:D:0:0
					values = data[5].split("|");
					n = values.length;
					var isRelay = (data[3] !== "IOX");
					var portsArray = isRelay ? me.Relays : me.IOPorts;
					for (i=0; i < n; i++) {
						var iostatus = values[i].split(":");
						portNum = parseInt(iostatus[0].substring(1), 10) - 1;
						if (portNum >= 0 && portNum < portsArray.length) {
							// the portValueChanged call takes care of firing a state change event if there is an actual change
							if (isRelay) {
								portsArray[portNum].portValueChanged(me, CFLink.IOPort.Mode.RELAY_CONTROL_OUTPUT, parseInt(iostatus[1],10));
							} else {
								portsArray[portNum].portValueChanged(me, iostatus[1], parseInt(iostatus[2],10));
							}
						}
					}
					break;

				case "POS":
					// Relay power-on status reply
					values = data[5].split("|");
					n = values.length;
					for (i=0; i < n; i++) {
						var pos = values[i].split(":");
						portNum = parseInt(pos[0].substring(1), 10);
						if (portNum > 0 && portNum <= me.Relays.length) {
							me.Relays[portNum - 1].powerOnStateReceived(pos[1]);
						}
					}
					break;

				default:
					this.$super(data, regex, me);
					break;
			}
		}
	});

/**
 * Event fired when the configuration of a CFMini was updated
 * @constant
 * @type {String}
 */
CFLink.CFMini.CONFIGURATION_CHANGE = "Mini_ConfigurationUpdated";
CFLink.IRBlaster = CFLink.Device.$extend(
	/**
	 * @lends CFLink.IRBlaster.prototype
	 */
	{
		/**
		 * This object is the JavaScript interface to a CommandFusion IR Blaster device.
		 *
		 * @constructs
		 * @protected
		 * @summary Interface to IRBlaster devices
		 *
		 */
		__init__:function (systemName, id, dataString) {
			var data, reqDescription = (dataString == null);
			if (reqDescription) {
				data = ["", "", "", ""];
			} else {
				// parse data string in this format: IRBlaster:<SERIAL#>:<APP_VER>:<CFLINK_VER>
				data = dataString.split(":");
			}
			this.IRPorts = [];
			for (i = 1; i <= 2; i++) {
				// TODO: proper creation of IR ports
				this.IRPorts.push(new CFLink.IOPort(this, i));
			}

			// Now use the parsed contents to assign the object properties
			this.$super(systemName, "IRBlaster", "IRB", id, data[1], data[2], data[3]);

			// Listen for replies from this CFLink ID
			CFLink.attachReplyCallbackByCFLinkID(id, this.replyData, this);

			if (reqDescription) {
				this.send("Q","WHO","");
			}
		},

		/**
		 * Send an IR code from the onboard database of the IRBlaster. See {@link http://www.commandfusion.com/docs/cflink/irdatabase.html}
		 * for more details on the IR database.
		 * @param {CFLink.IRBlaster.Port} port the port(s) to sed the IR code to
		 * @param {string} deviceType the device tye
		 * @param codeSet
		 * @param key
		 * @instance
		 */
		sendDatabaseCode: function(port, deviceType, codeSet, key) {
			this.send("T", "SND", port + ":DBA:" + deviceType + ":" + codeSet + ":" + key);
		},

		/**
		 * Send a raw IR code to the specified port(s). Use one of the constant from
		 * {@link CFLink.IRBlaster.Port} enum to select the output port.
		 * @param {@link CFLink.IRBlaster.Port} port the IR port(s) to send to. Can send to both output ports simultaneously
		 * @param {string} irCode the raw hex code (Often called CCF) to send. Only 'learned' IR codes (starting with 0000) are allowed.
		 * @instance
		 */
		sendRawCode: function(port, irCode) {
			this.send("T", "SND", port + ":RAW:" + irCode);
		},

		/**
		 * Send a IR code (in CF IR format) to the specified port(s). Use one of the constant from
		 * {@link CFLink.IRBlaster.Port} enum to select the output port.
		 * @param {@link CFLink.IRBlaster.Port} port the IR port(s) to send to. Can send to both output ports simultaneously
		 * @param {string} irCode an IR code in CF IR format. See the CF IR Format documentation for details at {@link http://www.commandfusion.com/docs/cflink/irformat.html}.
		 * @instance
		 */
		sendCFCode: function(port, irCode) {
			this.send("T", "SND", port + ":STR:" + irCode);
		},

		/**
		 * Setup a callback function that will be called whenever IR data is received by IRBlaster on the specified
		 * port(s). You can specify that you want to received messages from {@link CFLink.IRBlaster.Port.INTERNAL},
		 * {@link CFLink.IRBlaster.Port.EXTERNAL} or {@link CFLink.IRBlaster.Port.BOTH}.
		 *
		 * Your callback function should be of the form:
		 *
		 * function myCallback(irblasterDevice, port, data)
		 *
		 * where `irblasterDevice' is this {@link CFLink.IRBlaster} object, port is either {@link CFLink.IRBlaster.Port.INTERNAL}
		 * or {@link CFLink.IRBlaster.Port.EXTERNAL} and data is the actual IR data received.
		 *
		 * @param {CFLink.IRBlaster.Port} port	the IRBlaster port you want to monitor (see description)
		 * @param {Function} callback		    your callback function, of the form callback(cfmini_object, portNumber, value)
		 * @param {Object} me            		the object to set as `this' when calling your callback function
		 * @return {Number} a watcher ID that you can use to stop watching with {@link CFLink.IRBlaster.unwatch}
		 * @instance
		 */
		watchIncomingIR: function(port, callback, me) {
			return CFLink.watch(CFLink.IRBlaster.IR_CODE_RECEIVED, this, function(evt, sender, inPort, data) {
				if (inPort == port || port == CFLink.IRBlaster.BOTH) {
					callback.apply(me, [sender, inPort, data]);
				}
			}, this);
		},

		unwatch: function(watcherID) {
			CFLink.unwatch(watcherID);
		},

		/** @private */
		replyData:function (data, regex, me) {
			if (data[4] === "RCV") {
				// extract port and data and fire event. Parameters happen to match type and order of data received :-)
				CFLink.fire(CFLink.IRBlaster.IR_CODE_RECEIVED, me, data[5].split(":"));
			} else {
				this.$super(data, regex, me);
			}
		}
	});

/**
 * Event sent when the onboard IR receiver of the IRBlaster device receives
 * an IR code. Your callback function should have the prototype:
 * function(event, sender, irCodeString)
 * event is the name of this event
 * sender is the {@link CFLink.IRBlaster} object that received the IR Code
 * port is either {@link CFLink.IRBlaster.Port.INTERNAL} or {@link CFLink.IRBlaster.Port.EXTERNAL} and indicates which input of the IR Blaster received the IR Code
 * irCodeString is a String containing the received IR code
 */
CFLink.IRBlaster.IR_CODE_RECEIVED = "IRBlaster_IRCodeReceived";

/**
 * Constants for IRBlaster ports
 * @enum
 */
CFLink.IRBlaster.Port = {
	/**
	 * This constant represents the onboard IR port of the IR Blaster
	 * @constant
	 */
	INTERNAL: "P01",
	/**
	 * This constant represents the external IR port of the IR Blaster
	 * @constant
	 */
	EXTERNAL: "P02",
	/**
	 * This contants represents both internal and external ports of the IR Blaster
	 * and is only used when sending IR data to indicate that IR data should be sent
	 * via both ports at the same time
	 * @constant
	 */
	BOTH: "PZZ"
}

/**
 * Constants for IR data formats
 * @enum
 */
CFLink.IRBlaster.Format = {
	/**
	 * Send an IR command from the internal database
	 * @constant
	 */
	DB: "DBA",
	/**
	 * Send an IR command stored in IR Blaster memory
	 */
	Memory: "MEM",
	/**
	 * Send raw IR codes
	 */
	Raw: "RAW",
	/**
	 * Send CommandFusion-format IR Codes
	 */
	CF: "STR"
}
CFLink.SW16 = CFLink.Device.$extend(
	/**
	 * @lends CFLink.SW16.prototype
	 * @extends CFLink.Device
	 */
	{
		/**
		 * The CFLink.SW16 object lets you interact with an SW16 device on your CFLink bus
		 * @param systemName
		 * @param id
		 * @param dataString
		 * @constructs
		 * @summary Interface to a SW16 device
		 */
		__init__:function (systemName, id, dataString) {
			// Now use the parsed contents to assign the object properties
			// Take the data string in this format: LANBridge:<SERIAL#>:<APP_VER>:<CFLINK_VER>
			// And parse its contents:
			var i, data, reqDescription = (dataString == null);
			if (reqDescription) {
				data = ["","","",""];
			} else {
				// parse data string in this format: CFMini:<SERIAL#>:<APP_VER>:<CFLINK_VER>
				data = dataString.split(":");
			}

			// Now use the parsed contents to assign the object properties
			this.$super(systemName, "SW16", "SWX", id, data[1], data[2], data[3]);
			this.dryContacts = [];
			this.LEDs = [];
			this.backlightLEDs = [];
			this.enabled = 1;

			for (i = 0; i < 16; i++) {
				this.dryContacts[i] = -1;
				this.LEDs.push(new CFLink.LEDPort(this, i + 1, false));
			}
			for (i = 1; i <= 4; i++) {
				this.backlightLEDs.push(new CFLink.LEDPort(this, i, true));
			}

			// Listen for replies from SW16 units on this ID
			CFLink.attachReplyCallbackByCFLinkID(id, this.replyData, this);

			// read the status of this module
			if (reqDescription) {
				this.send("Q","WHO","");
			}
			this.readStatus();
		},

		/**
		 * Get the current state of a dry contact of this SW16
		 * @param number    the dry contact number (1-16)
		 * @return 1 if closed (pushed), 0 if open (released), -1 if not known yet
		 */
		getDryContactState:function (number) {
			return this.dryContacts[number - 1];
		},

		/**
		 * Obtain the full state list of dry contacts. Returns an array of numbers.
		 * First element represents dry contact #1, last element (index 15) represents dry contact #16.
		 * @return {Array} an array of numbers
		 */
		getDryContactStates: function() {
			return new Array(this.dryContacts);
		},

		/**
		 * Obtain the {@link CFLink.LEDPort} object at specified position. You can obtain the current
		 * state and level from the returned object.
		 * @param number    the LED to get (1-16)
		 * @return {CFLink.LEDPort} a LED object
		 */
		getLED:function (number) {
			return this.LEDs[number - 1];
		},

		/**
		 * Obtain the backlight {@link CFLink.LEDPort} object at specified position. You can obtain the current
		 * state and level from the returned object.
		 * @param number    the backlight LED to get (1-4)
		 * @return {CFLink.LEDPort} a LED object
		 */
		getBacklightLED:function (number) {
			return this.backlightLEDs[number - 1];
		},

		/**
		 * Ask the device to report its complete status (dry contacts states, LEDs & backlight LEDs current values)
		 */
		readStatus:function () {
			// Get input status
			this.send("Q", "STA", "");
			// Get LED status
			this.send("Q", "LED", "");
			// Get backlight LED status
			this.send("Q", "BKL", "");
		},

		_processReplyData:function (data, processFunc) {
			var pieces = data.split("|");
			var parts, slot, i, n = pieces.length;
			for (i = 0; i < n; i++) {
				parts = pieces[i].split(":");
				slot = parseInt(parts[0].substring(1), 10) - 1;
				processFunc(slot, parts);
			}
		},

		replyData:function (data, regex, me) {
			var n, state, slot;
			switch (data[4]) {
				case "STA" :
					// Dry contacts status reply from the SW16 module
					me._processReplyData(data[5], function (slot, parts) {
						n = parseInt(parts[1], 10);
						if (me.dryContacts[slot] !== n) {
							me.dryContacts[slot] = n;
							CFLink.fire(CFLink.SW16.DRY_CONTACT_CHANGE, me, [ slot + 1, n ]);
						}
					});
					break;

				case "CHA":
					// A single dry contact changed
					state = data[5].split(":");
					slot = parseInt(state[0].substring(1), 10) - 1;
					n = parseInt(state[1], 10);
					if (n !== me.dryContacts[slot]) {
						me.dryContacts[slot] = n;
						CFLink.fire(CFLink.SW16.DRY_CONTACT_CHANGE, me, [ slot + 1, n ]);
					}
					break;

				case "LED":
					// LED status reply from the SW16 module
					me._processReplyData(data[5], function (slot, parts) {
						me.LEDs[slot].updateLEDState(me, parts[1], parseInt(parts[2], 10));
					});
					break;

				case "BKL":
					// Backlight LED status reply from the SW16 module
					me._processReplyData(data[5], function (slot, parts) {
						me.backlightLEDs[slot].updateLEDState(me, parts[1], parseInt(parts[2], 10));
					});
					break;

				default:
					this.$super(data, regex, me);
					break;
			}
		},

		/**
		 * internal function that uses methods from the LED class to generate commands
		 * target is "LED" (main LEDs) or "BKL" (backlight panel LEDs). Index is number or array of numbers
		 * @param target
		 * @param index
		 * @param command
		 * @param params
		 * @private
		 */
		_sendLEDCommand:function (target, index, command, params) {
			var msg, o, leds = (target === "LED") ? this.LEDs : this.backlightLEDs;
			if (index instanceof Array) {
				var i, n = index.length, l;
				msg = "";
				for (i = 0; i < n; i++) {
					l = index[i];
					if (CF.debug && (l < 1 || l > leds.length)) {
						CF.log("Warning: SW16 " + (target == "LED" ? "LED" : "Backlight LED") + " number " + l + " is not in the range 1-" + leds.length);
						continue;
					}
					o = leds[l - 1];
					if (i > 0) {
						msg = msg + "|" + o[command].apply(o, params);
					}
					else {
						msg = o[command].apply(o, params);
					}
				}
				this.send("T", target, msg);
			} else {
				if (CF.debug && (index < 1 || index > leds.length)) {
					CF.log("Warning: SW16 " + (target == "LED" ? "LED" : "Backlight LED") + " number " + index + " is not in the range 1-" + leds.length);
					return;
				}
				o = leds[index - 1];
				this.send("T", target, o[command].apply(o, params));
			}
		},

		//
		// LED change functions
		//

		/**
		 * Toggle the state of one or more LEDs
		 * @param index    a single led number (1-16) or an array of led numbers (i.e. [1,3,5,9])
		 */
		toggleLED:function (index) {
			this._sendLEDCommand("LED", index, "toggleCommand", [ ]);
		},

		/**
		 * Sets the state of one or more LEDs
		 * @param index		a single led number (1-16) or an array of led numbers (i.e. [1,3,5,9])
		 * @param on		true to turn on, false to turn off
		 */
		setLED:function (index, on) {
			this._sendLEDCommand("LED", index, "setCommand", [ (on === true || on === 1 || on === "1") ]);
		},

		/**
		 * Pulse one or more LEDs
		 * @param index		a single led number (1-16) or an array of led numbers (i.e. [1,3,5,9])
		 * @param time		the time to pulse the LED on for, in a resolution of 0.1 seconds. Min 0 seconds (0), Max 999.9 seconds (9999)
		 */
		pulseLED:function (index, time) {
			this._sendLEDCommand("LED", index, "pulseLEDCommand", [ time ]);
		},

		/**
		 * Ramp one or more LEDs
		 * @param index    a single led number (1-16) or an array of led numbers (i.e. [1,3,5,9])
		 * @param level    the level to which to ramp the aforementioned LEDs
		 * @param time    the ramp duration in 0.1s increments
		 */
		rampLED:function (index, level, time) {
			this._sendLEDCommand("LED", index, "rampLEDCommand", [ level, time ]);
		},

		/**
		 * Dim one or more LEDs, fading between the minimum and maximum levels
		 * @param index        a single led number (1-16) or an array of led numbers (i.e. [1,3,5,9])
		 * @param minLevel    minimum level (0-100)
		 * @param maxLevel    maximum level (0-100)
		 * @param timeToMax    time to reach max level, in 0.1s increments
		 * @param timeToMin    time to reach min level, in 0.1s increments
		 * @param count        number of times to dim from min level to max level and back. Pass 0 for unlimited
		 */
		dimLED:function (index, minLevel, maxLevel, timeToMax, timeToMin, count) {
			this._sendLEDCommand("LED", index, "dimLEDCommand", [ minLevel, maxLevel, timeToMax, timeToMin, count ]);
		},

		/**
		 * Blink one or more LEDs, switching instantly between the minimum and maximum levels  and remaining at each level the specified time
		 * @param index        a single led number (1-16) or an array of led numbers (i.e. [1,3,5,9])
		 * @param minLevel    minimum level (0-100)
		 * @param maxLevel    maximum level (0-100)
		 * @param timeMax    time to stay at max level, in 0.1s increments
		 * @param timeMin    time to stay at min level, in 0.1s increments
		 * @param count        number of times to switch from min level to max level and back. Pass 0 for unlimited
		 */
		blinkLED:function (index, minLevel, maxLevel, timeMax, timeMin, count) {
			this._sendLEDCommand("LED", index, "blinkLEDCommand", [ minLevel, maxLevel, timeMax, timeMin, count ]);
		},

		//
		// Backlight LED functions
		//

		/**
		 * Toggle the state of one or more backlight LEDs
		 * @param index    a single backlight led number (1-4) or an array of backlight led numbers (i.e. [1,3])
		 */
		toggleBacklightLED:function (index) {
			this._sendLEDCommand("BKL", index, "toggleCommand", [ ]);
		},

		/**
		 * Sets the state of one or more backlight LEDs
		 * @param index        a single backlight led number (1-4) or an array of backlight led numbers (i.e. [1,3])
		 * @param on        true to turn on, false to turn offevel of the LED, 0-100
		 */
		setBacklightLED:function (index, on) {
			this._sendLEDCommand("BKL", index, "setCommand", [  (on === true || on === 1 || on === "1") ]);
		},

		/**
		 * Pulse one or more backlight LEDs
		 * @param index    a single backlight led number (1-4) or an array of backlight led numbers (i.e. [1,3])
		 * @param time    the time to pulse the LED on for, in a resolution of 0.1 seconds. Min 0 seconds (0), Max 999.9 seconds (9999)
		 */
		pulseBacklightLED:function (index, time) {
			this._sendLEDCommand("BKL", index, "pulseLEDCommand", [ time ]);
		},

		/**
		 * Ramp one or more LEDs
		 * @param index    a single backlight led number (1-4) or an array of backlight led numbers (i.e. [1,3])
		 * @param level    the level to which to ramp the aforementioned LEDs
		 * @param time    the ramp duration in 0.1s increments
		 */
		rampBacklightLED:function (index, level, time) {
			this._sendLEDCommand("BKL", index, "rampLEDCommand", [ level, time ]);
		},

		/**
		 * Dim one or more backlight LEDs, fading between the minimum and maximum levels
		 * @param index        a single backlight led number (1-4) or an array of backlight led numbers (i.e. [1,3])
		 * @param minLevel    minimum level (0-100)
		 * @param maxLevel    maximum level (0-100)
		 * @param timeToMax    time to reach max level, in 0.1s increments
		 * @param timeToMin    time to reach min level, in 0.1s increments
		 * @param count        number of times to dim from min level to max level and back. Pass 0 for unlimited
		 */
		dimBacklightLED:function (index, minLevel, maxLevel, timeToMax, timeToMin, count) {
			this._sendLEDCommand("BKL", index, "dimLEDCommand", [ minLevel, maxLevel, timeToMax, timeToMin, count ]);
		},

		/**
		 * Blink one or more LEDs, switching instantly between the minimum and maximum levels and remaining at each level the specified time
		 * @param index        a single backlight led number (1-4) or an array of backlight led numbers (i.e. [1,3])
		 * @param minLevel    minimum level (0-100)
		 * @param maxLevel    maximum level (0-100)
		 * @param timeMax    time to stay at max level, in 0.1s increments
		 * @param timeMin    time to stay at min level, in 0.1s increments
		 * @param count        number of times to switch from min level to max level and back. Pass 0 for unlimited
		 */
		blinkBacklightLED:function (index, minLevel, maxLevel, timeMax, timeMin, count) {
			this._sendLEDCommand("BKL", index, "blinkLEDCommand", [ minLevel, maxLevel, timeMax, timeMin, count ]);
		},

		//
		// Helper to simplify watching contacts
		//

		/**
		 * Setup a callback function that is called when the state of selected contacts changes
		 * This is a simple helper that watches the {@link CFLink.SW16.DRY_CONTACT_CHANGE} event and only calls you back
		 * when one of the dry contacts you want to watch changes state. Note that when a contact is being pressed then
		 * released, you will be called twice (once for Press, once for Release)
		 * @param {Array} contacts        an array of the contact numbers to watch. Pass `null' to watch all dry contacts
		 * @param {Function} callback    your callback function, of the form callback(sw16_object, contactNumber, contactState)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {number} a watcherID you can use to unwatch with {@link CFLink.SW16.unwatchContacts}
		 */
		watchContacts: function(contacts, callback, me) {
			return CFLink.watch(CFLink.SW16.DRY_CONTACT_CHANGE, this, function (evt, sender, contactNumber, state) {
				if (contacts == null || contacts.hasOwnProperty(contactNumber)) {
					callback.apply(me, [this, contactNumber, state]);
				}
			}, this);
		},

		/**
		 * Stop watching the contact changes you asked to be notified for in {@link CFLink.SW16.watchContacts}. You could
		 * as well call {@link CFLink.unwatch} which does the same thing.
		 * @param {number} watcherID the watcher ID that was returned by {@link CFLink.SW16.watchContacts}
		 */
		unwatchContacts:function (watcherID) {
			CFLink.unwatch(watcherID);
		},

        /**
         * Setup a callback function that is called when the state of selected LED changes
         * This is a simple helper that watches the {@link CFLink.LEDPort.STATE_CHANGE} event and only calls you back
         * when one of the LEDs you want to watch changes state.
         * @param {Array} leds          an array of the LED numbers to watch. Pass `null' to watch all LEDs
         * @param {Function} callback    your callback function, of the form callback(sw16_object, ledPort, ledState)
         * @param {Object} me            the object to set as `this' when calling your callback function
         * @return {number} a watcherID you can use to unwatch with {@link CFLink.SW16.unwatchLEDs}
         */
        watchLEDs: function(leds, callback, me) {
            return CFLink.watch(CFLink.LEDPort.STATE_CHANGE, this, function (evt, sender, ledPort, state, level) {
                if (!ledPort.backlight && (leds == null || leds.hasOwnProperty(ledPort.portNumber))) {
                    callback.apply(me, [this, ledPort.portNumber, state, level]);
                }
            }, this);
        },

        /**
         * Stop watching the LED changes you asked to be notified for in {@link CFLink.SW16.watchLEDs}. You could
         * as well call {@link CFLink.unwatch} which does the same thing.
         * @param {number} watcherID the watcher ID that was returned by {@link CFLink.SW16.watchLEDs}
         */
        unwatchLEDs:function (watcherID) {
            CFLink.unwatch(watcherID);
        },

		/**
		 * Setup a callback function that is called when the state of selected LED changes
		 * This is a simple helper that watches the {@link CFLink.LEDPort.STATE_CHANGE} event and only calls you back
		 * when one of the LEDs you want to watch changes state.
		 * @param {Array} leds          an array of the LED numbers to watch. Pass `null' to watch all LEDs
		 * @param {Function} callback    your callback function, of the form callback(sw16_object, ledPort, ledState)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {number} a watcherID you can use to unwatch with {@link CFLink.SW16.unwatchBacklightLEDs}
		 */
		watchBacklightLEDs: function(leds, callback, me) {
			return CFLink.watch(CFLink.LEDPort.STATE_CHANGE, this, function (evt, sender, ledPort, state, level) {
				if (ledPort.backlight && (leds == null || leds.hasOwnProperty(ledPort.portNumber))) {
					callback.apply(me, [this, ledPort.portNumber, state, level]);
				}
			}, this);
		},

		/**
		 * Stop watching the Backlight LED changes you asked to be notified for in {@link CFLink.SW16.watchBacklightLEDs}. You could
		 * as well call {@link CFLink.unwatch} which does the same thing.
		 * @param {number} watcherID the watcher ID that was returned by {@link CFLink.SW16.watchBacklightLEDs}
		 */
		unwatchBacklightLEDs:function (watcherID) {
			CFLink.unwatch(watcherID);
		}
	});

/**
 * Event fired when a dry contact changes state
 * Your callback function for watching this event should be of the type:
 * function(event, sender, dryContactNumber, state)
 * the dryContactNumber is the number of the dry contact, 1-16
 * the state is 1 or 0
 * @type {String}
 */
CFLink.SW16.DRY_CONTACT_CHANGE = "SW16_DryContactChange";

CFLink.CFSolo = CFLink.Device.$extend(
	/**
	 * @lends CFLink.CFSolo.prototype
	 * @extends CFLink.Device
	 */
	{
		/**
		 * This object represents a CommandFusion Solo device on ethernet or serial.
		 *
		 * @constructs
		 * @protected
		 * @summary Interface to a CF Solo device
		 */
		__init__:function (systemName, cflinkID, dataString) {
			var i, data, reqDescription = (dataString == null);
			if (reqDescription) {
				data = ["","","",""];
			} else {
				// parse data string in this format: CFSOLO:<SERIAL#>:<APP_VER>:<CFLINK_VER>:<IP4>:<MAC>
				data = dataString.split(":");
			}

			// Now use the parsed contents to assign the object properties
			this.$super(systemName, "CFSOLO", "SOL", cflinkID, data[1], data[2], data[3]);
			this.ipAddress = data[4];
			this.subnetMask = "255.255.255.0";
			this.gateway = null;
			this.dns = null;
			this.macAddress = data[5];
			this.DHCPEnabled = 1;
			this.schedules = [];
			this.time = Date.now();
			this.dryContacts = [];
			for (i = 0; i < 4; i++) {
				this.dryContacts[i] = -1;
			}
			this.rs232Ports = [];
			for (i = 1; i <= 2; i++) {
				this.rs232Ports.push(new CFLink.RS232Port(systemName, cflinkID, "SOL", i));
			}
			this.broadcastEnabled = 0;

			// Listen for replies from CF Solo units on this ID
			CFLink.attachReplyCallbackByCFLinkID(cflinkID, this.replyData, this);

			// Get the remaining configuration settings for the CF Solo
			if (reqDescription) {
				this.send("Q","WHO","");
			}
			// Get main config (including RS232)
			this.send("Q", "CFG", "");
			// Get time
			this.send("Q", "TME", "");
			// Get input states
			this.send("Q", "STA", "");
		},

		/**
		 * Get the current state of a dry contact of this device
		 * @param number    the dry contact number (1-4)
		 * @return 1 if closed (pushed), 0 if open (released), -1 if not known yet
		 */
		getDryContactState:function (number) {
			return this.dryContacts[number - 1];
		},

		/**
		 * Obtain the full state list of dry contacts. Returns an array of numbers.
		 * First element represents dry contact #1, last element (index 3) represents dry contact #4.
		 * @return {Array} an array of numbers
		 */
		getDryContactStates: function() {
			return new Array(this.dryContacts);
		},

		/**
		 * Send a CFLink packet to the device to obtain the general information about this LANBridge
		 * device (IP address, DCHP settings, etc)
		 * @instance
		 */
		getInfo:function () {
			this.send("Q", "WHO", "");
		},

		/**
		 * Override to make sure we update our ports' device ID
		 * @param id
		 * @instance
		 */
		setCFLinkID:function (id) {
			this.$super(id);
			var i, n;
			for (i = 0, n = this.slots.length; i < n; i++) {
				this.slots[i].deviceID = id;
			}
			for (i = 0, n = this.rs232Ports.length; i < n; i++) {
				this.rs232Ports[i].deviceID = id;
			}
		},

		//
		// LANBridge IP control
		//

		/**
		 * Send a DHCP mode change command to the device (effective after device resets)
		 * @param {boolean} isEnabled    true to enable DHCP, false to disable
		 * @instance
		 */
		setDHCP:function (isEnabled) {
			this.send("C", "DHC", isEnabled ? 1 : 0);
		},

		/**
		 * Send an IP address change command to the device (effective after device resets)
		 * @param ip    Full IP Address in IPv4 format, eg. 192.168.0.100
		 * @instance
		 */
		setIP:function (ip) {
			this.send("C", "IP4", ip);
		},

		/**
		 * Send a subnet mask change command to the device
		 * @param ip    Full Subnet Mask in IPv4 format, eg. 255.255.255.0
		 * @instance
		 */
		setSubnetMask:function (ip) {
			this.send("C", "SNM", ip);
		},

		/**
		 * Send an IP gateway address change command to the device.
		 * @param ip    Full IP Gateway in IPv4 format, eg. 192.168.0.1
		 * @instance
		 */
		setGateway:function (ip) {
			this.send("C", "GTW", ip);
		},

		/**
		 * Set the UDP Broadcasting Mode of the device
		 * @param {boolean} isEnabled    pass true to enable UDP Broadcasting, false to disable.
		 * @instance
		 */
		setBroadcasting:function (isEnabled) {
			this.send("C", "UDB", isEnabled ? 1 : 0);
		},

		/**
		 * Set the time of the realtime clock on board the device
		 * @param {Number} year
		 * @param {Number} month
		 * @param {Number} day Day in month
		 * @param {Number} weekday Day of the week 1-7
		 * @param {Number} hour
		 * @param {Number} minute
		 * @param {Number} second
		 * @param {Number} timezone the timezone from lookup table (1-40)
		 * @instance
		 */
		setTime:function (year, month, day, weekday, hour, minute, second, timezone) {
			this.send("C", "TME", year + ":" + month + ":" + day + ":" + weekday + ":" + hour + ":" + minute + ":" + second + ":" + timezone);
		},

		/**
		 * Send data to the specified LANBridge communication slot.
		 * @param {Number} slotNumber    slot 1 (CFLink), 2 (RS232), 3 (UDP broadcast) or 11-20 (user-bridgeable)
		 * @param {string} data            the data to send, provided as a string (even if binary data - a string made of binary characters)
		 * @instance
		 */
		sendData:function (slotNumber, data) {
			if (slotNumber === 2) {
				// use special RS232 packet when talking to LANBridge's RS232 port
				this.send("T", "SPW", data);
			} else if (slotNumber === 1 || (slotNumber >= 11 && slotNumber <= 20)) {
				this.send("T", "SND", String(slotNumber) + ":" + data);
			}
		},

		_processReplyData:function (data, processFunc) {
			var pieces = data.split("|");
			var parts, slot, i, n = pieces.length;
			for (i = 0; i < n; i++) {
				parts = pieces[i].split(":");
				slot = parseInt(parts[0].substring(1), 10) - 1;
				processFunc(slot, parts);
			}
		},

		/** @private */
		replyData:function (data, regex, me) {
			var config;
			switch (data[4]) {
				case "STA" :
					// Dry contacts status reply from the SW16 module
					me._processReplyData(data[5], function (slot, parts) {
						n = parseInt(parts[1], 10);
						if (me.dryContacts[slot] !== n) {
							me.dryContacts[slot] = n;
							CFLink.fire(CFLink.CFSolo.DRY_CONTACT_CHANGE, me, [ slot + 1, n ]);
						}
					});
					break;
				case "CFG" :
					// Device Configuration
					// eg: <IPADDRESS>:<SUBNETMASK>:<GATEWAY>:<DNS>:<DHCPMODE>:<UDPBROADCAST>
					config = data[5].split(":");
					if (config.length >= 6) {
						me.ipAddress = config[0];
						me.subnetMask = config[1];
						me.gateway = config[2];
						me.dns = config[3];
						me.DHCPEnabled = parseInt(config[4], 10);
						me.broadcastEnabled = parseInt(config[11], 10);
						CFLink.fire(CFLink.CFSolo.CONFIGURATION_CHANGE, me, []);
					}
					break;
				case "UDB":
					// UDP Broadcasting config
					var udb = parseInt(data[5], 10);
					if (udb !== me.broadcastEnabled) {
						me.broadcastEnabled = udb;
						CFLink.fire(CFLink.CFSolo.CONFIGURATION_CHANGE, this, []);
					}
					break;
				case "SPC":
					// RS232 port configuration reply
					// e.g. <PORT01 config>|<PORT02 config>
					values = payload.split("|");
					for (i = 0, n = values.length; i < n; i++) {
						var cfg = values[i];
						var sep = cfg.indexOf(':');
						if (sep > 0) {
							portNum = parseInt(cfg.substring(1), 10);
							this.RS232Ports[portNum - 1].readConfig(this, cfg.substring(sep+1));
						}
					}
					break;
				case "SPR":
					// COM port serial data received
					var s = payload;
					portNum = parseInt(s.substring(1,2),10);
					idx = s.indexOf(':',idx);
					if (idx > 0) {
						this.RS232Ports[portNum - 1].serialDataReceived(device, s.substring(idx+1));
					}
					break;
				case "WHO":
					config = data[5].split(':');
					me.serial = config[1];
					me.firmwareVer = config[2];
					me.protocolVer = config[3];
					me.ipAddress = config[4];
					me.macAddress = config[5];
					CFLink.fire(CFLink.Device.INFO_RECEIVED, me, [ ]);
					break;
				default:
					this.$super(data, regex, me);
					break;
			}
		},

		/**
		 * Setup a callback function that is called when the state of selected contacts changes
		 * This is a simple helper that watches the {@link CFLink.CFSolo.DRY_CONTACT_CHANGE} event and only calls you back
		 * when one of the dry contacts you want to watch changes state. Note that when a contact is being pressed then
		 * released, you will be called twice (once for Press, once for Release)
		 * @param {Array} contacts        an array of the contact numbers to watch. Pass `null' to watch all dry contacts
		 * @param {Function} callback    your callback function, of the form callback(sw16_object, contactNumber, contactState)
		 * @param {Object} me            the object to set as `this' when calling your callback function
		 * @return {number} a watcherID you can use to unwatch with {@link CFLink.SW16.unwatchContacts}
		 */
		watchContacts: function(contacts, callback, me) {
			return CFLink.watch(CFLink.CFSolo.DRY_CONTACT_CHANGE, this, function (evt, sender, contactNumber, state) {
				if (contacts == null || contacts.hasOwnProperty(contactNumber)) {
					callback.apply(me, [this, contactNumber, state]);
				}
			}, this);
		},

		/**
		 * Stop watching the contact changes you asked to be notified for in {@link CFLink.SW16.watchContacts}. You could
		 * as well call {@link CFLink.unwatch} which does the same thing.
		 * @param {number} watcherID the watcher ID that was returned by {@link CFLink.SW16.watchContacts}
		 */
		unwatchContacts:function (watcherID) {
			CFLink.unwatch(watcherID);
		}
	});
/**
 * Event fired when the configuration of a CF Solo was updated
 * @constant
 * @type {String}
 */
CFLink.CFSolo.CONFIGURATION_CHANGE = "CFSolo_ConfigurationUpdated";

/**
 * Event fired when a dry contact changes state
 * Your callback function for watching this event should be of the type:
 * function(event, sender, dryContactNumber, state)
 * the dryContactNumber is the number of the dry contact, 1-4
 * the state is 1 or 0
 * @type {String}
 */
CFLink.CFSolo.DRY_CONTACT_CHANGE = "CFSolo_DryContactChange";