/*  Multi Mode Manager module for CommandFusion
===============================================================================

AUTHOR:		Jarrod Bell, CommandFusion
CONTACT:	support@commandfusion.com
URL:		https://github.com/CommandFusion/DemoUserInterfaces
VERSION:	v1.0.0
LAST MOD:	Friday, 16 September 2011

=========================================================================
HELP:

NOTE: Requires iViewer 4 v4.0.6 or higher!!!

This module emulates how MultiMode buttons work in Crestron land.

Create a separate multi mode manager object for each group of themes.

Enter an array of analog joins to watch for the specific theme group.

The digital join and analog join must be the same number for this to work.

The analog join must be in use somewhere in your project, so add a gauge on the analog join
on some page that you never access just so we can track its changes.

=========================================================================
*/

// ======================================================================
// Global Object
// ======================================================================

var MultiModeManager = function(params) {
	var self = {
		analogJoins:	[],
		themePrefix:	""
	};

	self.onAnalogJoinChange = function (j, v) {
		// Toggle the objects theme based on the join value1
		var joinNumber = j.substr(1); // strip the "a" from the join string to just get the join number.
		CF.setProperties({join: "d"+joinNumber, theme: self.themePrefix + v});
	};

	// Save params passed to the object on creation, setting default values if the param is missing
	self.analogJoins = params.analogJoins || [];
	self.themePrefix = params.themePrefix || "theme_";

	// Watch the joins relating to this multi mode manager
	CF.watch(CF.JoinChangeEvent, self.analogJoins, self.onAnalogJoinChange);

	return self;
}


// Only use one userMain function in your project. So if you have multiple scripts that need to do setup on startup,
// group all startup code into the one userMain function in any script.
CF.userMain = function () {
	// This manager is for buttons using the "btn_rect" group of themes (rectangular buttons in the demo GUI)
	var MultiModeBtnRect = new MultiModeManager({analogJoins: ["a1", "a2", "a3"], themePrefix: "btn_rect_"});

	// This manager is for buttons using the "btn_rnd" group of themes (round buttons in the demo GUI)
	var MultiModeBtnRound = new MultiModeManager({analogJoins: ["a11", "a12", "a13"], themePrefix: "btn_rnd_"});
};