// TV Guide Sample Data
var guideData = {
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

// Guide Setup
var minuteWidth = 1, borderWidth = 4, guideList = "l1";

// Startup function - Code in here is run once the JavaScript API is ready
CF.userMain = function() {
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