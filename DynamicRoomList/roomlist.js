/* Dynamic Room List module for CommandFusion
===============================================================================

AUTHOR:		Jarrod Bell, CommandFusion
CONTACT:	support@commandfusion.com
URL:		https://github.com/CommandFusion/DemoUserInterfaces
VERSION:	v1.0.0
LAST MOD:	Wednesday, 5 October 2011

=========================================================================
HELP:

1. Create an XML file with your levels and room list (use same format as shown in the included xml file).
2. Upload this XML file so that its accessibly via a HTTP request. (in the Crestron processor web server maybe?)
3. Change the URL at the bottom of this script.
4. Create pages in your GUI to match the page names in your XML (spaces in XML are fine, they will be removed to match non-spaces in guiDesigner page names).

=========================================================================
*/

var DynamicRooms = function (url) {

	var self = {
		url:		url,
		levels:		[],		// Array to store all the levels
		viewingLevels:	true,
		houseName:	"",
		currentLevel:	0,
	};

	// Level object to store the details for each level
	var Level = function (num, theName) {
		this.name = theName;
		this.number = num;
		this.rooms = [];
	};

	// Room object to store the details for each room
	var Room = function (num, theName) {
		this.name = theName;
		this.number = num;
	};

	self.sortLevels = function (a, b) {
		return a.number - b.number;
	};

	self.showLevelsList = function () {
		self.viewingLevels = true;
		CF.setJoin("s1", self.houseName);
		// Hide the back button
		CF.setProperties({join: "d11", opacity: 0});
		// Clear the list
		CF.listRemove("l1");

		var levelsList = [];
		for (var i = 0; i < self.levels.length; i++) {
			levelsList.push({s1: self.levels[i].name, d1: { tokens: { "number": self.levels[i].number } }});
		}
		CF.listAdd("l1", levelsList);
		//CF.logObject(levelsList);
	};

	self.selectItem = function (list, listIndex, join) {
		if (self.viewingLevels) {
			self.viewingLevels = false;
			self.currentLevel = listIndex;
			CF.setJoin("s1", self.levels[listIndex].name);
			// Show rooms for this level now

			// Show the back button
			CF.setProperties({join: "d11", opacity: 1});
			// Clear the list
			CF.listRemove("l1");

			var roomList = [];
			for (var i = 0; i < self.levels[listIndex].rooms.length; i++) {
				roomList.push({s1: self.levels[listIndex].rooms[i].name, d1: { tokens: { "number": self.levels[listIndex].rooms[i].number } }});
			}
			CF.listAdd("l1", roomList);
		} else {
			// Selected a room - perform some other action, perhaps a page flip (remove any non-alphanumeric chars from room name, and try to flip to its page)
			CF.flipToPage(self.levels[self.currentLevel].rooms[listIndex].name.replace(/[^\w]/g,""));

			// NOTE: You need to have these page names matching your room names from the XML document, otherwise the flip will obviously fail.
			// Just use no spaces in your page names in guiDesigner, spaces are fine in the XML room names as they are stripped before attempting the page flip.
		}
	};

	self.loadRooms = function () {
		// Load the XML data from a URL
		CF.request(self.url, function (status, headers, body) {
			// Check that the URL request returned without error
			if (status == 200) {
				// Use the returned body and create an XML DOM object
				var parser = new DOMParser();
				var xmlDoc = parser.parseFromString(body, 'text/xml');

				// Get the house name
				self.houseName = xmlDoc.getElementsByTagName("house")[0].attributes["name"].value;
				CF.setJoin("s1", self.houseName);

				// Clear any existing rooms and levels before loading the new ones
				self.levels = [];

				var levelNodes = xmlDoc.getElementsByTagName("level");
				for (var i = 0; i < levelNodes.length; i++) {
					// Create the level object
					var newLevel = new Level(levelNodes[i].attributes["number"].value, levelNodes[i].attributes["name"].value);
					CF.log("Level: " + levelNodes[i].attributes["name"].value);

					// Get the room nodes
					for (var j = 0; j < levelNodes[i].childNodes.length; j++) {
						if (levelNodes[i].childNodes[j].nodeName == "room") {
							// Add the room to the level
							newLevel.rooms.push(new Room(levelNodes[i].childNodes[j].attributes["number"].value, levelNodes[i].childNodes[j].childNodes[0].nodeValue));
							CF.log("Room: " + levelNodes[i].childNodes[j].childNodes[0].nodeValue);
						}
					}
					self.levels.push(newLevel);
				}

				// Finished parsing the XML, now sort the levels and setup the list
				self.levels.sort(self.sortLevels);
				self.showLevelsList();

			} else {
				CF.log("XML Request Failed with status " + status);
			}
		});
	};

	return self;
};

// Global object so that we can reference it via button JavaScript calls.
var rooms;

// Note there should only be one userMain function in all your scripts for a single project.
// So move all the below code to a single userMain function if you already have one.
CF.userMain = function () {

	rooms = new DynamicRooms("https://raw.github.com/CommandFusion/DemoUserInterfaces/master/DynamicRoomList/house.xml");
	rooms.loadRooms();

};