// ------------------------------------------------------------------
// Interlock.js
//
// A simple module to manage interlock groups in iViewer
//
// The module provides a suite of simple calls to manage interlocks:
//
// * to create an interlock group:
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
// Author: Florent Pillet, CommandFusion
// ------------------------------------------------------------------
var Interlock = {
	groups: { },			// internal management object

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
	}
};
