/* MediaPortal Script for CommandFusion
=========================================================================

AUTHOR: Jarrod Bell, CommandFusion
CONTACT: support@commandfusion.com
URL: www.commandfusion.com/scripting/examples/MP
VERSION: v0.0.1
LAST MODIFIED: 8 May 2011

=========================================================================
HELP:

To use this script, please complete the following steps:
1. Download the CommandFusion plugin for MediaPortal and install it:
   - http://www.commandfusion.com/downloads
2. Add this script to your project properties.
3. Create a system in system manager named 'MP'.
   - Set the IP address to match the IP of your PC running MP
   - Set the port to whatever port you choose in the plugin settings within MP (Default 8024)
   - Set the EOM to \xF5\xF5
4. Add a single feedback item named 'MP Incoming Data' with regex as follows: (?ms)\xF3(.*?)\xF4(.*?)\xF5\xF5
   - You do not need to add anything else to the feedback item, just the name and regex.

NOTE: Without the system and feedback item defined exactly as above, this script will not work!!
=========================================================================
*/


// ======================================================================
// MP Object
// ======================================================================

var MP = {
	
	// Default Join Numbers
	joinTVList:				2000,
	joinMovieList:			1000,

	// Data states
	perRow:					3,
	gotMoviesAlready:		false,
	gotTVSeriesAlready:		false,
	newListContent:			[],
	// Javascript doesnt support "dot matches all" flag for regular expressions,
	// so we use a character class [\s\S] (match white spaces and non-whitespaces, therefor any character)
	// to ensure that we even capture carriage returns and line breaks.
	feedbackRegex:			/\xF3([\s\S]*?)\xF4([\s\S]*?)\xF5\xF5/g,
	coverArtURL:			null,
	moviesListItems:		0,
	moviesLetterIndexes:	[],

	setup: function() {
		MP.log("MP Setup Started.");

		// Check that the "MP" system is defined in the GUI. Otherwise no commands from JS will work!
		if (CF.systems["MP"] === undefined) {
			// Show alert
			CF.log("Your GUI file is missing the 'MP' system.\nPlease add it to your project before continuing.\n\nSee readme in comments at top of the script.");
			//CF.alert("Your GUI file is missing the 'MP' system.\nPlease add it to your project before continuing.\n\nSee readme in comments at top of the script.");
			// Cancel further JS setup
			return;
		}

		// Watch all incoming data through a single feedback item
		CF.watch(CF.FeedbackMatchedEvent, "MP", "MP Incoming Data", MP.incomingData);

		// Ensure loading image is hidden
		CF.setProperties({join: "s"+MP.joinTVList, opacity:0.0, scale:0.5});

		// Get the MP system IP address and port for use in all cover art calls
		MP.coverArtURL = "http://"+CF.systems["MP"].address+":"+(CF.systems["MP"].port+1)+"/"; // ?getalbumart

		CF.watch(CF.ConnectionStatusChangeEvent, "MP", MP.onConnectionChange, true);

		MP.log("MP Setup Complete.");
	},
	// ======================================================================
	//  Handle Connections/Disconnections
	// ======================================================================
	onConnectionChange: function (system, connected, remote) {
		if (connected) {
			// Connection established
			MP.log("MP Connected!");
			// Hide error subpage
			CF.setProperties({join:"d"+(MP.joinTVList-1), opacity:1.0, scale:1.25}, 0.0, 0.15, CF.AnimationCurveEaseOut, function() {
				CF.setProperties({join:"d"+(MP.joinTVList-1), scale:0.5, opacity:0.0}, 0.0, 0.15, CF.AnimationCurveEaseIn);
			});
			//MP.getMovies(2);
		} else {
			// Connection lost
			MP.log("MP Disconnected!!");
			// Hide the season and episode list subpages
			CF.setJoins([
				{ "join": "d"+(MP.joinTVList+1), "value": 0 },
				{ "join": "d"+(MP.joinTVList+2), "value": 0 }
			]);
			// Allow requesting the artist list again
			MP.gotMoviesAlready = false;
			MP.gotTVSeriesAlready = false;
			// Show error subpage
			CF.setProperties({join:"d"+(MP.joinTVList-1), opacity:1.0, scale:1.25}, 0.0, 0.15, CF.AnimationCurveEaseOut, function() {
				CF.setProperties({join:"d"+(MP.joinTVList-1), scale:1.0, opacity:1.0}, 0.0, 0.15, CF.AnimationCurveEaseIn);
			});
		}
	},

	// ======================================================================
	// Incoming Data Point
	// ======================================================================
	incomingData: function (itemName, matchedString) {
		// Match the incoming message against regex to grab the command name and data
		// All incoming data should match the following format: \xF3<COMMAND>\xF4<DATA>\xF5\xF5
		var seriesList = "l" + MP.joinTVList;
		var seasonsList = "l" + (MP.joinTVList+1);
		var episodesList = "l" + (MP.joinTVList+2);
		var movieList = "l" + (MP.joinMovieList);
		// Reset the regex to work correctly after each consecutive match
		MP.feedbackRegex.lastIndex = 0;
		var matches = MP.feedbackRegex.exec(matchedString);
		if (matches != null) {
			MP.log("MP: Incoming Data - "+matchedString);
			// Split the data into its chunks
			var dataArray = matches[2].split("|");
			// Check what command was received first
			switch (matches[1]) {

				// ARTIST LIST BUILDING =====================================
				case "RLISTMOVIES": // Returning a list of Movies
					var end = false;
					var searching = false;
					// Now check if the message is the list start message
					if (dataArray[0] == "start") {
						MP.log("MP: Movie List Start");
						// Example data format: start|<totalMovies>|<perRow>|<isSearchResult>
						// Get the total count and store it for later
						//MP.countMovies = dataArray[1];
						MP.perRow = dataArray[2];
						if (dataArray[3] == "1") {
							searching = true;
						}
						MP.gotMoviesAlready = true;
						// Clear the list
						CF.listRemove(movieList);
						MP.newListContent = [];
						MP.moviesLetterIndexes = [];
						MP.movisListItems = 0;
					} else if (dataArray[0] == "title") { // Row of title data
						//MP.log("MP: Movie List Title");
						// Example data format: title|<artistLetter>
						MP.newListContent.push({title: true, s1: dataArray[1]});
						// Get the title index for letter scrolling
						MP.artistLetterIndexes.push({letter: dataArray[1], index: MP.artistsListItems});
						MP.moviesListItems++;
					} else if (dataArray[0] == "item") { // Row or rows of list data (depending on perRow grabbed from list start message)
						MP.log("MP: Movie List Item");
						// item|<index>|<ID>|<title>|<year>[|repeat for each movie in perRow]
						var nextItem = {s1: "", s2: "", d1: {tokens: {"[id]": ""}}, d2: {tokens: {"[id]": ""}}};
						for (var i = 0; i < MP.perRow; i++) {
							// Push the item into the list array, along with a token for [artist]
							var id = dataArray[(i*2)+2];
							//MP.newListContent.push({s1: {value: artist, tokens: {"[artist]": artist}}});
							nextItem["s"+(i+1)] = MP.coverArtURL+"?getmoviethumb&id="+id;
							nextItem["d"+(i+1)].tokens["[id]"] = id;
						}
						MP.newListContent.push(nextItem);
						MP.moviesListItems++;
					} else if (dataArray[0] == "end") { // List end message
						//MP.log("MP: Artist List End - " + MP.newListContent.length);
						end = true;
						// Hide "list loading" indicator image
						CF.setProperties({join:"s"+MP.joinMovieList, opacity:1.0, scale:1.25}, 0.0, 0.15, CF.AnimationCurveEaseOut, function() {
							CF.setProperties({join:"s"+MP.joinMovieList, scale:0.5, opacity:0.0}, 0.0, 0.15, CF.AnimationCurveEaseIn);
						});
					}

					// Add to the list in chunks of 50 items
					var numQueued = MP.newListContent.length;
					if ((end && numQueued > 0) || numQueued >= 50) {
						CF.listAdd(movieList, MP.newListContent);
						MP.newListContent = [];
					}
					break;

				// ARTIST ALBUM LIST BUILDING ===============================
				case "RLISTALBUMS": // Returning a list of Artist Albums
					var end = false;
					// Now check if the message is the list start message
					if (dataArray[0] == "start") {
						//MP.log("MP: Artist Album List Start");
						// Show a loading indicator
						//loadingInterval = setInterval();
						// Example data format: start|<totalAlbums>|<artistName>|<perRow>
						MP.countArtistAlbums = dataArray[1];
						MP.perRow = dataArray[3];
						// Set a global token with the artist name for getting track lists later
						CF.setToken(CF.GlobalTokensJoin, "[albumartist]", dataArray[2]);
						// Clear the list
						CF.listRemove(albumsList);
						// Set the artist title in the list header
						//MP.newListContent.push({title: true, s1: "Albums by "+dataArray[2]});
					} else if (dataArray[0] == "item") { // Row or rows of list data (depending on perRow grabbed from list start message)
						//MP.log("MP: Artist Album List Item");
						// Example data format: item|<itemNum>|<albumName>|<totalTracks>|<year>
						for (var i = 0; i < MP.perRow; i++) {
							// Push the item into the list array, along with a token for [artist]
							var album = dataArray[(i*2)+2];
							MP.newListContent.push({s1: album, s2: MP.coverArtURL+"?getalbumart="+album, s3: dataArray[(i*4)+4]});
						}
					} else if (dataArray[0] == "end") { // List end message
						//MP.log("MP: Artist Album List End");
						end = true;
					}
					// Add to the list in chunks of 50 items
					var numQueued = MP.newListContent.length;
					if ((end && numQueued > 0) || numQueued >= 50) {
						CF.listAdd(albumsList, MP.newListContent);
						MP.newListContent = [];
					}
					break;
				// ALBUM TRACK LIST BUILDING ===============================
				case "RLISTTRACKS": // Returning a list of Album Tracks
					var end = false;
					// Now check if the message is the list start message
					if (dataArray[0] == "start") {
						//MP.log("MP: Album Track List Start");
						// Example data format: start|<totalTracks>|<artistName>|<albumName>|<perRow>
						MP.countAlbumTracks = dataArray[1];
						MP.perRow = dataArray[4];
						// Set a global token with the artist name for getting track lists later
						CF.setToken(CF.GlobalTokensJoin, "[trackalbum]", dataArray[3]);
						// Clear the list
						CF.listRemove(trackList);
						// Set the album title in the list header
						//MP.newListContent.push({title: true, s1: "Album: "+dataArray[3]});
					} else if (dataArray[0] == "item") { // Row or rows of list data (depending on perRow grabbed from list start message)
						//MP.log("MP: Album Track sList Item");
						// Example data format: item|<trackNum>|<trackName>|<duration>
						for (var i = 0; i < MP.perRow; i++) {
							// Push the item into the list array, along with a token for [artist]
							var trackNum = dataArray[(i*1)+1];
							var track = dataArray[(i*2)+2];
							var duration = dataArray[(i*3)+3];
							// Nice trick for number padding: http://www.codigomanso.com/en/2010/07/simple-javascript-formatting-zero-padding/
							MP.newListContent.push({s1: trackNum, s2: track, s3: ("0"+Math.floor(duration/60)).slice(-2)+":"+("0"+(duration%60)).slice(-2)});
						}
					} else if (dataArray[0] == "end") { // List end message
						//MP.log("MP: Album Track List End");
						end = true;
					}
					// Add to the list in chunks of 50 items
					var numQueued = MP.newListContent.length;
					if ((end && numQueued > 0) || numQueued >= 50) {
						CF.listAdd(trackList, MP.newListContent);
						MP.newListContent = [];
					}
					break;
				// ALBUM TRACK LIST BUILDING ===============================
				case "RLISTZONEPLAYLIST": // Returning a list of current zone playlist Tracks
					var end = false;
					// Now check if the message is the list start message
					if (dataArray[0] == "start") {
						//MP.log("MP: Playlist Track List Start");
						// Example data format: start|<zoneNum>|<perRow>
						MP.countZoneTracks = dataArray[1];
						MP.perRow = dataArray[3];
						// Clear the list
						CF.listRemove(nowPlayingList);
						// Set the album title in the list header
						//MP.newListContent.push({title: true, s1: "Album: "+dataArray[3]});
					} else if (dataArray[0] == "item") { // Row or rows of list data (depending on perRow grabbed from list start message)
						//MP.log("MP: Playlist Track List Item");
						// Example data format: item|<playlistTrackNum>|<duration>|<artist>|<album>|<trackname>|<tracknum>
						for (var i = 0; i < MP.perRow; i++) {
							// Push the item into the list array, along with a token for [artist]
							var playlistNum = dataArray[(i*1)+1];
							var duration = dataArray[(i*2)+2];
							var artist = dataArray[(i*3)+3];
							var album = dataArray[(i*4)+4];
							var track = dataArray[(i*5)+5];
							var trackNum = dataArray[(i*6)+6];
							// Nice trick for number padding: http://www.codigomanso.com/en/2010/07/simple-javascript-formatting-zero-padding/
							MP.newListContent.push({s1: playlistNum, s2: track+"\n"+artist, s3: ("0"+Math.floor(duration/60)).slice(-2)+":"+("0"+(duration%60)).slice(-2)});
						}
					} else if (dataArray[0] == "end") { // List end message
						//MP.log("MP: Playlist Track List End");
						end = true;
					}
					// Add to the list in chunks of 50 items
					var numQueued = MP.newListContent.length;
					if ((end && numQueued > 0) || numQueued >= 50) {
						CF.listAdd(nowPlayingList, MP.newListContent);
						MP.newListContent = [];
					}
					break;
				// ZONE LIST BUILDING ===============================
				case "RLISTZONES": // Returning a list of Album Tracks
					var end = false;
					// Now check if the message is the list start message
					if (dataArray[0] == "start") {
						//MP.log("MP: Zone List Start");
						// Example data format: start|<totalZones>|<perRow>
						MP.countZones = dataArray[1];
						MP.perRow = dataArray[2];
						// Clear the list
						CF.listRemove(zoneList);
						MP.zones = [];
					} else if (dataArray[0] == "zone") { // Row or rows of list data (depending on perRow grabbed from list start message)
						//MP.log("MP: Zone List Item");
						// Example data format: zone|<zoneNumber>|<zoneName>|<playbackState>|<position>|<duration>|<artist>|<album>|<trackName>|<trackNumber>
						// If playback is stopped (no track info) then all items after <playbackState> are null:
						// Example data format: zone|<zoneNumber>|<zoneName>|<playbackState>||||||
						for (var i = 0; i < MP.perRow; i++) {
							// Push the item into the list array
							var zoneNum = dataArray[(i*1)+1];
							var zone = dataArray[(i*2)+2];
							var state = dataArray[(i*3)+3];
							var position = dataArray[(i*4)+4];
							var duration = dataArray[(i*5)+5];
							var artist = dataArray[(i*6)+6];
							var album = dataArray[(i*7)+7];
							var trackName = dataArray[(i*8)+8];
							var trackNumber = dataArray[(i*9)+9];
							MP.newListContent.push({s1: zone});
							MP.zones.push({name: zone, num: zoneNum});
						}
					} else if (dataArray[0] == "end") { // List end message
						//MP.log("MP: Zone List End");
						end = true;
					}
					// Add to the list in chunks of 50 items
					var numQueued = MP.newListContent.length;
					if ((end && numQueued > 0) || numQueued >= 50) {
						CF.listAdd(zoneList, MP.newListContent);
						MP.newListContent = [];
						if (MP.zones.length > 0) {
							// Default to zone 0 on startup.
							MP.setActiveZone(0);
						}
					}
					break;
				case "RVOL": // Returning volume level of current zone
					CF.setJoin("a"+MP.joinVol, (65535/100)*dataArray[0]);
					break;
				case "RACTIVEZONE": // Returning current zone name
					// <zoneName>|<zoneIndex>
					CF.setJoin("s360", dataArray[0]);
					// Deactivate all zone buttons
					for (var i = 0; i<MP.zones.length; i++) {
						CF.setJoin(zoneList+":"+i+":d1", "0");
					}
					// Activate selected zone button
					CF.setJoin(zoneList+":"+dataArray[1]+":d1", "1");

					// Get the zone playlist
					//MP.getCurrentZoneNowPlaying();
					MP.getCurrentZonePlaylist();
					break;
				case "RPLAYSTATE": // Change of playback status for current zone
					if (dataArray[0] == 2) {
						// Playing
						CF.setJoin("d350", 1);
					} else {
						// Not playing
						CF.setJoin("d350", 0);
					}
					break;
				case "RNOWPLAYING": // Now playing data
					//CF.log(matchedString);
					// <zoneNum>|<zoneName>|<playbackState>|<position>|<duration>|<artist>|<album>|<trackname>|<tracknum>|<playlistPos>
					var zoneNum = dataArray[0];
					var zone = dataArray[1];
					var state = dataArray[2];
					var position = dataArray[3];
					var duration = dataArray[4];
					var artist = dataArray[5];
					var album = dataArray[6];
					var trackName = dataArray[7];
					var trackNumber = dataArray[8];
					var playlistPos = dataArray[9];
					var sliderPos = 0;
					if (duration > 0) {
						sliderPos = Math.round((65535/duration)*position);
					}
					CF.setJoins([{join: "s310", value: MP.coverArtURL+"?getcurrentart"}, {join: "s311", value: trackName}, {join: "s312", value: artist}, {join: "s313", value: album},
						{join: "a310", value: sliderPos}, {join: "s314", value: ("0"+Math.max(0,Math.floor(position/60))).slice(-2)+":"+("0"+Math.max(0,position%60)).slice(-2)},
						{join: "s315", value: ("0"+Math.floor(duration/60)).slice(-2)+":"+("0"+(duration%60)).slice(-2)}]);
					// Nice trick for number padding: http://www.codigomanso.com/en/2010/07/simple-javascript-formatting-zero-padding/

					CF.listInfo(nowPlayingList, function(list, count, first, numVisible) {
						// If the list contains enough items to show the currently playing item (might not be updated yet)
						if (count > playlistPos) {
							// Set current track flag in list
							CF.listUpdate(nowPlayingList, [{index: CF.AllItems, d2: 0}, {index: playlistPos, d2: 1}]);
						}
					});
					
					break;
			}
		}
	},

    // ======================================================================
    // Library Browsing Functions
    // ======================================================================
	getMovies: function (perRow) {
		if (!MP.gotMoviesAlready) {
			CF.setProperties({join:"s"+MP.joinMovieList, opacity:1.0, scale:1.25}, 0.0, 0.15, CF.AnimationCurveEaseOut, function() {
				CF.setProperties({join:"s"+MP.joinMovieList, scale:1.0}, 0.0, 0.15, CF.AnimationCurveEaseIn);
			});
			MP.sendMsg("TGETLIST", ["allmovies",perRow]);
		}
	},
	// A button in the artist list is pressed, now we get the value of the text on that button
	// and send it through to the getArtistAlbums function
	selectArtistList: function (list, listIndex, join, numRows) {
		CF.getJoin(list+":"+listIndex+":s1", function (j, v) {
			MP.getArtistAlbums(v, numRows);
		});
	},
	getArtistAlbums: function (artist, numRows) {
		// Check what action to perform
		switch (MP.defaultArtistAction) {
			case MP.ActionPlay:
				MP.sendMsg("TPLAY", ["artist",artist]);
				break;
			case MP.ActionPlayNext:
				MP.sendMsg("TPLAYNEXT", ["artist",artist]);
				break;
			case MP.ActionEnqueue:
				MP.sendMsg("TADD", ["artist",artist]);
				break;
			case MP.ActionClearPlay:
				MP.sendMsg("TCLEAR");
				MP.sendMsg("TPLAY", ["artist",artist]);
				break;
		}
		// Request the album list
		MP.sendMsg("TGETLIST", ["albums",artist,numRows]);

		CF.setJoins([
			{ join: "d"+(MP.joinTVList+1), value: 1 },	// Show the album list subpage
			{ join: "d"+(MP.joinTVList+2), value: 0 }	// Hide the track list subpage
		]);
	},
	// A button in the album track list is pressed, now we get the value of the text on that button
	// and send it through to the getAlbumTracks function
	selectAlbumList: function (list, listIndex, join, numRows) {
		CF.getJoins([list+":"+listIndex+":s1",CF.GlobalTokensJoin], function (joins) {
			MP.getAlbumTracks(joins[CF.GlobalTokensJoin].tokens["[albumartist]"], joins[list+":"+listIndex+":s1"].value, numRows);
		});
	},
	getAlbumTracks: function (artist, album, numRows) {
		// Check what action to perform
		switch (MP.defaultAlbumAction) {
			case MP.ActionPlay:
				MP.sendMsg("TPLAY", ["album",artist,album]);
				break;
			case MP.ActionPlayNext:
				MP.sendMsg("TPLAYNEXT", ["album",artist,album]);
				break;
			case MP.ActionEnqueue:
				MP.sendMsg("TADD", ["album",artist,album]);
				break;
			case MP.ActionClearPlay:
				MP.sendMsg("TCLEAR");
				MP.sendMsg("TPLAY", ["album",artist,album]);
				break;
		}

		// Request the track list
		MP.sendMsg("TGETLIST", ["tracks",artist,album,numRows]);
		// Show the track list subpage
		CF.setJoin("d"+(MP.joinTVList+2), "1");
	},
	selectAlbumTrack: function (list, listIndex, join) {
		CF.getJoins([list+":"+listIndex+":s1",CF.GlobalTokensJoin], function (joins) {
			MP.selectTrack(joins[CF.GlobalTokensJoin].tokens["[albumartist]"], joins[CF.GlobalTokensJoin].tokens["[trackalbum]"], joins[list+":"+listIndex+":s1"].value);
		});
	},
	// Select a track from the library
	selectTrack: function (artist, album, trackNum) {
		switch (MP.defaultTrackAction) {
			case MP.ActionPlay:
				MP.sendMsg("TPLAY", ["track",artist,album,trackNum]);
				break;
			case MP.ActionPlayNext:
				MP.sendMsg("TPLAYNEXT", ["track",artist,album,trackNum]);
				break;
			case MP.ActionEnqueue:
				MP.sendMsg("TADD", ["track",artist,album,trackNum]);
				break;
			case MP.ActionClearPlay:
				MP.sendMsg("TCLEAR");
				MP.sendMsg("TPLAY", ["track",artist,album,trackNum]);
				break;
		}
	},
	changeAlbumAction: function (action) {
		// Save the state
		MP.defaultAlbumAction = action;
		// Update the state indicator buttons
		var baseJoin = "d"+(MP.joinTVList+1);
		CF.setJoins([
			{ "join": baseJoin+"1", value: (action==MP.ActionBrowse?"1":"0") },
			{ "join": baseJoin+"2", value: (action==MP.ActionPlay?"1":"0") },
			{ "join": baseJoin+"3", value: (action==MP.ActionEnqueue?"1":"0") },
			{ "join": baseJoin+"4", value: (action==MP.ActionClearPlay?"1":"0") },
		]);
		if (action==MP.ActionBrowse) {
			CF.setJoin("s"+(MP.joinTVList+1)+"0", "Browse");
		} else if (action==MP.ActionPlay) {
			CF.setJoin("s"+(MP.joinTVList+1)+"0", "Play");
		} else if (action==MP.ActionEnqueue) {
			CF.setJoin("s"+(MP.joinTVList+1)+"0", "Enqueue");
		} else if (action==MP.ActionClearPlay) {
			CF.setJoin("s"+(MP.joinTVList+1)+"0", "Clear & Play");
		}
	},
	// Scroll the artist list to a specific item index for a letter.
	// letterNum = 0-26 (where 0 = #, 1 = a, 2 = b, ... 26 = z)
	scrollToArtistLetter: function (letterNum) {
		// Invert the letterNum (due to slider top being highest value, yet smallest letter)
		letterNum = 26 - letterNum;
		var artistList = "l" + MP.joinTVList;
		// check that the artist index contains an entry for the chosen letter
		var indexLength = MP.artistLetterIndexes.length;
		for (var i = 0; i<indexLength; i++) {
			var chr = null;
			if (letterNum == 0) {
				chr = "#";
			} else {
				// Convert the letter number to the Unicode character it represents
				chr = String.fromCharCode(parseInt(letterNum) + 64); // A = 65
			}
			if (MP.artistLetterIndexes[i].letter == chr) {
				CF.listScroll(artistList, MP.artistLetterIndexes[i].index, CF.TopPosition, false);
				break;
			}
		}
	},

	// ======================================================================
    // Zone Functions
    // ======================================================================

	// A button in the zone list is pressed, now we get the value of the tokens on that button
	// and send it through to the setActiveZone function
	selectZoneList: function (list, listIndex, join) {
		CF.getJoin(list+":"+listIndex+":d1", function (j,v,t) {
			MP.setActiveZone(t["[zonenum]"]);
		});
	},
	setActiveZone: function (listIndex) {
		// Activate the chosen zone. Zone playlist will automatically be sent
		MP.sendMsg("TSETZONE", listIndex);
		MP.getCurrentZoneNowPlaying();
	},
	// Zone list button was held down, show the grouping subpage
	selectZoneListGroups: function (list, listIndex, join) {
		CF.getJoin(list+":"+listIndex+":d1", function (j,v,t) {
			MP.setActiveZone(t["[zonenum]"]);
		});
	},
	getZones: function (numRows) {
		MP.sendMsg("TGETLIST", ["zones",numRows]);
	},
	getCurrentZonePlaylist: function () {
		MP.sendMsg("TGETLIST", "zoneplaylist");
	},
	getCurrentZoneNowPlaying: function () {
		MP.sendMsg("TNOWPLAYING");
	},
	clearCurrentZonePlaylist: function () {
		// Remove all items from MP playlist
		MP.sendMsg("TCLEAR");
		// Remove all items from the local scrolling list
		CF.listRemove("l"+(MP.joinTVList+4));
		// Hide the confirmation subpage
		CF.setJoin("d310", 0);
	},
	clearZonePlaylist: function (zoneNum) {
		MP.sendMsg("TCLEARZONE", zoneNum);
	},
	// A button in the zone playing is pressed, now we get the value of the text on that button
	// and perform the appropriate action
	selectZonePlaylist: function (list, listIndex, join) {
		switch (MP.defaultZoneAction) {
			case MP.ActionDelete:
				// Delete the row from the list locally
				CF.listRemove(MP.nowPlayingList, listIndex);
				// Now tell MP to remove it
				MP.sendMsg("TITEMDELETE",listIndex);
				break;
			case MP.ActionPlay:
				MP.jumpToTrack(listIndex);
				break;
			case MP.ActionPlayNext:
				MP.sendMsg("TITEMPLAYNEXT",listIndex);
				break;
		}
	},
	// Jump to a specific position within the currently selected zone's playlist
	jumpToTrack: function (trackNum) {
		MP.sendMsg("TITEMPLAY",trackNum);
	},
	changeZoneAction: function(action) {
		// Save the state
		MP.defaultZoneAction = action;
		// Update the state indicator buttons
		var baseJoin = "d"+(MP.joinTVList+4);
		CF.setJoins([
			{ "join": baseJoin+"1", value: (action==MP.ActionDelete?"1":"0") },
			{ "join": baseJoin+"2", value: (action==MP.ActionPlayNext?"1":"0") },
			{ "join": baseJoin+"3", value: (action==MP.ActionPlay?"1":"0") },
		]);
	},
	// Show a list of zones that a zone can link to.
	showZoneGroupOptions: function (zoneNum) {

	},

	// ======================================================================
    // Transport Functions
    // ======================================================================

	playPause: function () {
		MP.sendMsg("TNAV","playpause");
	},
	next: function () {
		MP.sendMsg("TNAV","next");
	},
	prev: function () {
		MP.sendMsg("TNAV","prev");
	},
	getVolume: function() {
		MP.sendMsg("TVOLGET");
	},
	setVolume: function(level) {
		MP.sendMsg("TVOL", level);
	},
	scrubTrack: function(pos) {
		MP.sendMsg("TSCRUB", pos);
	},
	// Send a correctly build command to MP
	sendMsg: function(command, data) {
		CF.send("MP", "\xF3"+command+"\xF4"+(Array.isArray(data)?data.join("|"):data)+"\xF5\xF5");
	},
	// Only allow logging calls when CF is in debug mode - better performance in release mode this way
	log: function(msg) {
		if (CF.debug) {
			CF.log(msg);
		}
	}
};

CF.modules.push({name:"MP", setup:MP.setup});