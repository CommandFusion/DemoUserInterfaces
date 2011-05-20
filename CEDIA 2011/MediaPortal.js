/* MediaPortal Script for CommandFusion
===============================================================================
 _____                                           _______         _             
/  __ \                                         | |  ___|       (_)            
| /  \/ ___  _ __ ___  _ __ ___   __ _ _ __   __| | |_ _   _ ___ _  ___  _ __  
| |    / _ \| '_ ` _ \| '_ ` _ \ / _` | '_ \ / _` |  _| | | / __| |/ _ \| '_ \ 
| \__/\ (_) | | | | | | | | | | | (_| | | | | (_| | | | |_| \__ \ | (_) | | | |
 \____/\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_\_|  \__,_|___/_|\___/|_| |_|

===============================================================================

AUTHOR:		Jarrod Bell, CommandFusion
CONTACT:	support@commandfusion.com
URL:		https://github.com/CommandFusion/MediaPortal
VERSION:	v0.0.2
LAST MOD:	18 May 2011

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
	currentMovieID:			0,
	fanartAnimating:		null,

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
			MP.getVolume();
			MP.getMovies(2);
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
			//MP.log("MP: Incoming Data - "+matchedString);
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
						//MP.log("MP: Movie List Start");
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
						//MP.log("MP: Movie List Item");
						// item|<index>|<ID>|<title>|<year>[|repeat for each movie in perRow]
						var nextItem = {s1: "", s2: "", d1: {tokens: {"[id]": ""}}, d2: {tokens: {"[id]": ""}}};
						for (var i = 0; i < MP.perRow; i++) {
							// Push the item into the list array, along with a token for [artist]
							var id = dataArray[(i*5)+2];
							//MP.newListContent.push({s1: {value: artist, tokens: {"[artist]": artist}}});
							if (id != undefined) {
								nextItem["s"+(i+1)] = MP.coverArtURL+"?getmoviethumb&id="+id;
								nextItem["d"+(i+1)].tokens["[id]"] = id;
							}
						}
						MP.newListContent.push(nextItem);
						MP.moviesListItems++;
					} else if (dataArray[0] == "end") { // List end message
						//MP.log("MP: Movies List End");
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
				case "RMOVIEINFO":
					//MP.log("MP: Movie Info");
					// <ID>|<title>|<year>|<tagline>|<plot>|<runtime>|<rating>
					var id = dataArray[0];
					var title = dataArray[1];
					var year = dataArray[2];
					var tagline = dataArray[3];
					var plot = dataArray[4];
					var runtime = dataArray[5];
					var rating = dataArray[6];

					CF.setJoins([
						{ "join": "s1001", value: MP.coverArtURL+"?getmoviefanart&id="+id },
						{ "join": "s1002", value: title },
						{ "join": "s1003", value: year + ", " + runtime + "mins, " + rating + "/10"},
						{ "join": "s1004", value: tagline },
						{ "join": "s1005", value: plot }
					]);
					break;
				case "RVOL": // Returning volume level of current zone
					CF.setJoin("a1000", (65535/100)*dataArray[0]);
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

	// A button in the movie list is pressed
	selectMovie: function (list, listIndex, join) {
		//MP.currentMovieID = MP.movieIDs[(listIndex*2)+parseInt(join.substr(1))-1];
		//MP.sendMsg("TGETMOVIE", MP.currentMovieID);
		CF.getJoin(list+":"+listIndex+":"+join, function (j,v,t) {
			MP.currentMovieID = t["[id]"];
			MP.sendMsg("TGETMOVIE", MP.currentMovieID);
		});

		if (MP.fanartAnimating == null) {
			MP.animateFanart();
			MP.fanartAnimating = setInterval(function() {MP.animateFanart()}, 10000);
		}
	},

	animateFanart: function() {
		// Animate the fanart a little
		CF.setProperties({join: "s1001", scale: 1.1}, 0.0, 5.0, CF.AnimationCurveEaseInOut, function () {
			CF.setProperties({join: "s1001", scale: 1.0}, 0.0, 5.0, CF.AnimationCurveEaseInOut);
		});
	},

	playMovie: function (id) {
		if (id === undefined) {
			// Use the current movie ID
			MP.sendMsg("TPLAY", ["movie", MP.currentMovieID]);
		}
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
	fwd: function () {
		MP.sendMsg("TNAV","forward");
	},
	rew: function () {
		MP.sendMsg("TNAV","rewind");
	},
	getVolume: function() {
		MP.sendMsg("TGETVOL");
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