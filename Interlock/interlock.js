// ------------------------------------------------------------------
// Interlock.js
//
// A simple module to manage interlock groups in iViewer
//
// The module provides a suite of simple calls to manage interlocks:
//
// * create interlock groups via global tokens in guiDesigner
// Right Click project node (in project tree) and choose 'Global Token Manager..'
// Create a new token in the format: interlock_groupName (must start with prefix 'interlock_')
// Enter the digital join numbers separated by commas, eg: 1,2,3,4,5
// Optionally, enter the join number range (inclusive), eg: 1-5
// Or even mix the two formats to result in a single interlock across multiple ranges, eg: 1-5,8,10,20-30
// The interlock will then be automatically created at runtime by this script.
//
// * to create an interlock group via JS:
// Interlock.create("group name", join1, join2 ... joinN);
//
// * to set the currently selected item in an interlock group:
// Interlock.select("group name", join);
//
// * to be notified when the current selection of an interlock group changes:
// Interlock.watch("group name", function(group name, newSelectedJoin, previousSelectedJoin) {
//    ... do something here ...
// });
//
// * to stop being notified for an interlock group
// Interlock.unwatch("group name");
//
// * to get the current selected join for an interlock group
// var join = Interlock.get("group name");
//
// * to remove an interlock group (remove interlock functionality):
// Interlock.remove("group name");
//
// Authors:  Florent Pillet - CommandFusion, Jarrod Bell - CommandFusion
// Version: 1.3, 13-DEC-2013
// ------------------------------------------------------------------
var Interlock = {
	groups: { },			// internal management object
	tokenPrefix: "interlock_",

	/**
	 * Create a new Interlock group
	 * Supported syntaxes:
	 *
	 * Interlock.create(name, join1, join2 ... joinN)
	 * Interlock.create(name, array of joins)
	 *
	 * Any mix of the above (join arrays, individual joins) is also supported)
	 * Issues a warning and do nothing if a group with the same name already exists
	 */
	create: function(name) {
		var nargs = arguments.length;
		if (nargs <= 1) {
			CF.log("Warning: invalid number of arguments for Interlock.create()");
			return;
		}
		if (typeof(name) != "string" || name.length == 0) {
			CF.log("Warning: invalid interlock group name in Interlock.create()");
			return;
		}
		if (Interlock.groups.hasOwnProperty(name)) {
			CF.log("Warning: interlock group '" + name + "' already exists. Not creating a new one.");
			return;
		}
		var i,j,joins = [];
		for (i=1; i < nargs; i++) {
			j = arguments[i];
			if (typeof(j) == "string")
				joins.push(j);
			else if (j instanceof Array)
				joins.push.apply(joins, j);
			else
				CF.log("Warning: invalid join to add to Interlock group "+name+": " + j);
		}

		// add new interlock group
		var newGroup = {
			joins: joins,
			selection: ""
		};
		Interlock.groups[name] = newGroup;

		// watch join changes and perform action on change
		CF.watch(CF.JoinChangeEvent, joins, function(join,value) {
			if (value === 1 || value === "1") {
				// One of the joins we watch was raised: trigger the interlock mechanism
				var previous = newGroup.selection;
				newGroup.selection = join;
				var update = [], nJoins = joins.length;
				for (var idx=0; idx < nJoins; idx++) {
					if (join !== joins[idx]) {
						update.push({
							join: joins[idx],
							value: 0
						});
					}
				}
				// reset all the interlocked joins other than the one selected
				CF.setJoins(update);

				// call watch callback if there was a change
				if (newGroup.callback != null && previous !== join) {
					newGroup.callback.apply(null, [name, join, previous]);
				}
			} else if (join == newGroup.selection) {
				// simulated mode: if user taps the button again, raise it back to
				// ensure that it stays highlighted
				CF.setJoin(join, 1);
			}
		});

		// Get initial state. By the time the callback returns the result, an actual
		// selection may have been made, so make sure we test for this too
		CF.getJoins(joins, function(initial) {
			if (newGroup.selection != "")
				return;
			for (var j in initial) {
				if (initial.hasOwnProperty(j)) {
					var value = initial[j].value;
					if (value === 1 || value === "1") {
						newGroup.selection = j;
						break;
					}
				}
			}
		});
	},

	/**
	 * Remove an existing Interlock group if it exists
	 * Do nothing (issue a warning when using the Remote Debugger) if group does not exist
	 */
	remove: function(name) {
		if (!Interlock.exists(name,"remove"))
			return;
		CF.unwatch(CF.JoinChangeEvent, groups[name].joins);
		delete groups[name];
	},

	/**
	 * Watch overall changes (current selection) of an interlock group. The callback function
	 * you provide is being called with two arguments:
	 *  - the name of the interlock group
	 *  - the new selected join for this group
	 *
	 * Example:
	 * Interlock.watch("Zones", OnSelectZone);
	 *
	 * function OnSelectZone(interlockName, newSelection) {
	 *   CF.log("The new selection for interlock group " + interlockName + " is join " + newSelection);
	 * }
	 *
	 * In the example above, if button d1 is pressed and is part of the group, the OnSelectZone function
	 * will be called with: OnSelectZone("Zones", "d1")
	 */
	watch: function(name, callback) {
		if (!Interlock.exists(name,"watch"))
			return;
		Interlock.groups[name].callback = callback;
	},

	/**
	 * Remove any watcher function previously set on the given interlock group
	 */
	unwatch: function(name) {
		if (!Interlock.exists(name,"watch"))
			return;
		if (Interlock.groups[name].hasOwnProperty(callback))
			delete Interlock.groups[name].callback;
	},

	/**
	 * Get the current selected join for an interlock group
	 */
	get: function(name) {
		if (!Interlock.exists(name,"getSelection"))
			return;
		return Interlock.groups[name].selection;
	},

	/**
	 * Set the current selected join for an interlock group
	 */
	select: function(name, join) {
		if (!Interlock.exists(name,"select"))
			return;
		var group = Interlock.groups[name];
		if (group.joins.indexOf(join) === -1) {
			CF.log("Warning: Interlock.select() called with a join ('"+join+"') unknown in interlock '" + name + "'");
			return;
		}
		//group.selection = join;		// immediately reflect selected join
		CF.setJoin(join, 1, true);	// make sure the watch triggers
	},

	// internal helper function
	exists: function(name, caller) {
		if (!Interlock.groups.hasOwnProperty(name)) {
			CF.log("Warning: Interlock."+caller+"() called with unknown interlock group name: " + name);
			return false;
		}
		return true;
	},

	/**
	 * Automatically create interlock groups based on global tokens starting with 'interlock_'
	 * Globa Token value should be an array of join numbers (with or without the 'd') separated by commas (with or without a space after the comma)
	 */
	setup: function() {
		CF.getJoin(CF.GlobalTokensJoin, function(j,v,t) {
			for (tokenName in t) {
				if (tokenName.toLowerCase().indexOf(Interlock.tokenPrefix.toLowerCase()) === 0) {
					// Check if using comma separated or hyphenated format for join list
					var joins = [], joinSegments = [];
					joinSegments = t[tokenName].replace(/\s+/g, "").split(",");
					for (var i = 0; i<joinSegments.length; i++) {
						var seg = joinSegments[i];
						if (seg.indexOf("-") > 0) {
							var limits = seg.split("-");
							if (limits.length != 2) {
								CF.log("Interlock token join range is invalid: " + t[tokenName]);
								continue; // abort and jump to the next segment
							}
							joins = joins.concat(Interlock.range(limits[0], limits[1]));
						} else {
							joins.push(seg);
						}
					}

					for (var i = 0; i<joins.length; i++) {
						if (joins[i].indexOf("d") !== 0) {
							joins[i] = "d" + joins[i];
						}
					}
					var name = tokenName.substr(Interlock.tokenPrefix.length);
					CF.log("Created Interlock: " + name + " - " + joins.join(", "));
					Interlock.create(name, joins);
				}
			}
		});
	},

	range: function(start, stop) {
		for (var r = []; start <= stop; r.push(""+start++));
		return r;
	}
};



CF.modules.push({
	name: "Interlock",       // the name of the module (mostly for display purposes)
	setup: Interlock.setup,  // the setup function to call
	object: Interlock,       // the object to which the setup function belongs ("this")
	version: 1.3             // An optional module version number that is displayed in the Remote Debugger
});