// TV Guide Sample Data
var guideData = {
	date: "",
	channels: []
};

// Guide Setup
var minuteWidth = 2, borderWidth = 4, guideList = "l1";

var guideXML = "http://timefor.tv/xmltv/c81e728d9d4c2f636f067f89cc14862c";
//var guideXML = "http://192.168.0.10:8019/epg.xml";

// Startup function - Code in here is run once the JavaScript API is ready
CF.userMain = function() {
	// Check if we are going to dynamically load the Guide Data from XML service or use setup local sample data
	// Simply comment out the guideXML variable above to use sample data
	if (guideXML) {
		loadGuideXML(guideXML);
	} else {
		// Show sample data if not using a dynamic XML Guide service.
		guideData = {
			date: "7-11-2013",
			channels: [
				{
					name: "Channel 1",
					channel: 01,
					guideStartTime: 9,
					shows: [
						{
							title: "Show 1",
							mins: 60
						},
						{
							title: "Show 2",
							mins: 60
						},
						{
							title: "Show 3",
							mins: 90
						},
						{
							title: "Show 4",
							mins: 120
						},
						{
							title: "Show 5",
							mins: 60
						},
						{
							title: "Show 6",
							mins: 30
						},
						{
							title: "Show 7",
							mins: 30
						},
						{
							title: "Show 8",
							mins: 120
						},
						{
							title: "Show 9",
							mins: 60
						},
						{
							title: "Show 10",
							mins: 60
						},
					]
				},{
					name: "Channel 2",
					channel: 01,
					guideStartTime: 9,
					shows: [
						{
							title: "Show 1",
							mins: 90
						},
						{
							title: "Show 2",
							mins: 120
						},
						{
							title: "Show 3",
							mins: 90
						},
						{
							title: "Show 4",
							mins: 60
						},
						{
							title: "Show 5",
							mins: 30
						},
						{
							title: "Show 6",
							mins: 90
						},
						{
							title: "Show 7",
							mins: 30
						},
						{
							title: "Show 8",
							mins: 60
						},
						{
							title: "Show 9",
							mins: 120
						},
						{
							title: "Show 10",
							mins: 60
						},
					]
				}
			]
		};
	}
};

function updateGuideList(startDate) {
	// First clear the list
	CF.listRemove(guideList);
	// Create an array to store the new list data, so that we can push it all to the list in one CF.listAdd call.
	// Doing it this way is more efficient. The less CF.* calls you make, the better.
	var listData = [];
	// Loop through all the channels in the guide data
	for (var i = 0; i < guideData.channels.length; i++) {
		var newListItem = {};
		// Loop through all the shows in each channel
		for (var j = 0; j < guideData.channels[i].shows.length; j++) {
			// Dynamically assign the show title to the serial join of the button
			newListItem["s" + (j + 1)] = guideData.channels[i].shows[j].title;
		}
		// Push the list item data to the end of the array
		listData.push(newListItem);
	}
	
	// Finally add the data to the list
	CF.listAdd(guideList, listData);

	// Now we need to resize and show/hide respective show buttons based on their time duration (minutes)
	var listSizeData = [];
	// Loop through the channels again
	for (var i = 0; i < guideData.channels.length; i++) {
		// Store each show size in an array, again more efficient than making many CF.setProperties calls.
		var showSizes = [], nextX = 0;
		// Loop through all the shows in each channel
		for (var j = 0; j < guideData.channels[i].shows.length; j++) {
			// Get the duration of the show in minutes (based on the minuteWidth variable created earlier)
			var showWidth = (minuteWidth * guideData.channels[i].shows[j].mins) - borderWidth;
			// Push the property change to the end of the array
			showSizes.push({join: guideList+":"+i+":d" + (j + 1), w: showWidth, x: nextX, opacity: 1});
			// Calculate the x position of the next show in the channel, adding extra pixels to separate each show more clearly
			nextX += showWidth + borderWidth;
		}
		// Hide any buttons for shows which we don't have guide data for.
		// In our demo we allow for a max of 24 shows per item - this can be changed by adding more buttons to the guide item subpage.
		for (var j = guideData.channels[i].shows.length; j <= 24; j++) {
			// Use the opacity set to 0 to hide a button
			showSizes.push({join: guideList+":"+i+":d" + (j + 1), opacity: 0});
		}
		// Finally perform the resize and show/hide property changes
		CF.setProperties(showSizes);
	}
};

function loadGuideXML(path) {
	CF.log("Loading XML Data from " + path);

	// Regex used to process time and data data for shows
	var timeRegex = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s(.*)/;

	// Load the XML data from a URL
	CF.request(path, function (status, headers, body) {

		// Check that the URL request returned without error
		if (status == 200) {
			// Use the returned body and create an XML DOM object
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(body, 'text/xml');

			// Get all the channels
			var channels = xmlDoc.getElementsByTagName("channel");
			for (var i=0; i<channels.length; i++) {
				//CF.logObject(channels[i]);
				var channelID = channels[i].attributes['id'].value;

				// Get all the shows using XPath
				var shows = xmlDoc.evaluate("//programme[@channel='"+channelID+"']", xmlDoc, null, XPathResult.ANY_TYPE, null);
				// Must increment the interator to get the first show
				var show = shows.iterateNext();

				// An array we will be putting the guide data in for each channel
				var showArray = [];

				while (show) {
					// Parse the date time format string from the XML into useable data using regex
					var startTime = timeRegex.exec(show.getAttribute("start"));
					var endTime = timeRegex.exec(show.getAttribute("stop"));
					
					// Create date objects from the time string format used in the XML data
					var startDate = new Date(startTime[1], startTime[2], startTime[3], startTime[4], startTime[5], startTime[6]);
					var endDate = new Date(endTime[1], endTime[2], endTime[3], endTime[4], endTime[5], endTime[6]);
					
					// Push data to the array
					showArray.push({
						title: show.childNodes[1].childNodes[0].nodeValue,
						mins: (endDate - startDate) / 60000 // Convert date subtraction result in milliseconds to minutes
					});

					// Iterate to next show
					show = shows.iterateNext();
				}

				// Append the channel data to our guideData channels array
				guideData.channels.push({
					id: channelID,
					name: channels[i].childNodes[1].childNodes[0].nodeValue,
					icon: channels[i].childNodes[3].attributes['src'].value,
					channel: 01,
					shows: showArray
				});
			}

			// redraw the guide list
			updateGuideList();
		} else {
			CF.log("XML Request Failed with status " + status);
		}
	});
}

function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}