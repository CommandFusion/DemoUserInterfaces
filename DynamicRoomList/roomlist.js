/* Dynamic Room List module for CommandFusion
===============================================================================

AUTHOR:		Jarrod Bell, CommandFusion
CONTACT:	support@commandfusion.com
URL:		https://github.com/CommandFusion/DemoUserInterfaces
VERSION:	v1.0.0
LAST MOD:	Tuesday, 4 October 2011

=========================================================================
HELP:



=========================================================================
*/

CF.userMain = function () {

	// Load the XML data from a URL
	CF.request("https://github.com/CommandFusion/DemoUserInterfaces/DynamicRoomList/house.xml", function (status, headers, body) {
		// Check that the URL request returned without error
		if (status == 200) {
			// Use the returned body and create an XML DOM object
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(body, 'text/xml');
			CF.log("Child Nodes: " + xmlDoc.childNodes.length);
		} else {
			CF.log("XML Request Failed with status " + status);
		}
	});
};