var GUIURL;

CF.userMain = function() {
	CF.getGuiDescription(function(gui) {
		GUIURL = gui.url;
		CF.log("Base URL: " + GUIURL);
	});
};

function loadZip(dataType, filename) {
	dataType = dataType || "json";
	filename = filename || GUIURL + "/testData.json.zip";
	CF.request(filename, function(status, headers, data) {
		var testObj;
		var unzipper = new JSUnzip(data);
		if (!unzipper.isZipFile()) {
			CF.log("NOT A ZIP FILE!");
			return;
		}
		unzipper.readEntries();
		CF.log("Files in zip: " + unzipper.entries.length);
		// Just unzip the first file in the zip
		var entry = unzipper.entries[0];
		if (entry.compressionMethod === 0) {
			// Uncompressed
			testObj = entry.data;
		} else if (entry.compressionMethod === 8) {
			// Deflated
			testObj = JSInflate.inflate(entry.data);
		} else {
			CF.log("compressionMethod: " + entry.compressionMethod);
		}

		CF.logObject(entry);

		if (dataType == "json") {
			// Convert the raw JSON string into an object
			testObj = JSON.parse(testObj);
			// Now log some of the object properties
			CF.log(testObj.message);
		} else if (dataType == "xml") {
			// Convert the raw XML data into an Object
			var parser = new DOMParser();
			testObj = parser.parseFromString(testObj, 'text/xml');
			CF.log(testObj.getElementsByTagName("message")[0].childNodes[0].nodeValue);
		}
		
	});
}