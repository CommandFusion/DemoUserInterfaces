/*
 * Status Bar Module
 *
 *****************************************************
 USAGE:
 1. Add statusbar.js to your guiDesigner project
 2. Call one of the show/hide/toggle functions to change the status bar visibility

 ****************************************************/

var StatusBar = {
	show : function() {
		CF.setJoin("d17931", 1);
	},
	hide : function() {
		CF.setJoin("d17932", 1);
	},
	toggle : function() {
		CF.setJoin("d17922", 1);
	}
};

CF.modules.push({
	name: "Status Bar Module",
	object: StatusBar,
	version: "1.0"
});