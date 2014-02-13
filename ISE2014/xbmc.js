var XBMC = function(params) {
	var self = {
		ip: params.ip,
		port: params.port || 80,
		baseURL: "",
		imgURL: "",
		reqID: 0,
		lastError: "",
		movieList: [],
		albumList: [],
		currentlyPlaying: {
			id: null,
			type: null,
			speed: 0,
			percentage: 0,
			seekoffset: {
				hours: 0,
				minutes: 0,
				seconds: 0,
				milliseconds: 0
			},
			time: {
				hours: 0,
				minutes: 0,
				seconds: 0,
				milliseconds: 0
			},
			totaltime: {
				hours: 0,
				minutes: 0,
				seconds: 0,
				milliseconds: 0
			}
		},
		seeking: false,
		playStateChanged: null,
		mediaChanged: null,
		timerElapsed: null
	};

	self.init = function() {
		self.getApplicationInfo();
		self.getPlayerInfo();
		self.getMovies();
	};

	self.updateURL = function(newURL) {
		self.baseURL = newURL || "http://" + self.ip + ":" + self.port + "/jsonrpc";
		self.imgURL = "http://" + self.ip + ":" + self.port + "/image/";
	};

	self.rpc = function(method, params, callback) {
		try {
			self.reqID++;
			var json = {
				"jsonrpc": "2.0",
				"method": method,
				"params": params,
				"id": self.reqID
			};
			CF.log(JSON.stringify(json));
			CF.request(self.baseURL, "POST", null, JSON.stringify(json), function(status, headers, body) {
				try {
					if (status == 200) {

						var data = JSON.parse(body);
						if (data.error !== undefined) {
							self.lastError = data.error;
							CF.log("ERROR REPLY ---------");
							CF.logObject(self.lastError);
						} else {
							if (typeof callback == "function") {
								callback(JSON.parse(body));
							}
						}
					} else {
						self.lastError = (typeof(body)=="string" && body.length>0) ? body : "HTTP status: " + status;
						CF.log("ERROR REPLY ---------");
						CF.logObject(self.lastError);
					}
				} catch(e) {
					CF.log("Exception caught while processing response in xbmc.rpc: " + e);
				}
			});
		} catch (e) {
			CF.log("Exception caught in xbmc.rpc: " + e);
		}
	};

	self.getMovies = function(order, method) {

		order = order || "ascending";
		method = method || "none";

		self.rpc("VideoLibrary.GetMovies", { "sort": {"order": order, "method": method}, "properties": ["thumbnail", "plot", "playcount", "mpaa", "rating", "runtime", "year", "resume"]}, function(data) {
			//CF.logObject(data);

			self.movieList = [];
			CF.listRemove("lxbmc_movieListing_list");

			//CF.logObject(data.result, 10);

			for (var i = 0; i<data.result.limits.total; i+=2) {

				var movieID = data.result.movies[i].movieid;
				var thumbnail = self.imgURL + data.result.movies[i].thumbnail;
				var label = decode_utf8(data.result.movies[i].label.trunc(30));
				var plot = decode_utf8(data.result.movies[i].plot);
				var genre = decode_utf8(data.result.movies[i].genre);
				var playcount = data.result.movies[i].playcount;
				var mpaa = data.result.movies[i].mpaa;
				var rating = data.result.movies[i].rating;
				var runtime = data.result.movies[i].runtime;
				var year = data.result.movies[i].year;
				var resume = data.result.movies[i].resume;

				var movieID2 = data.result.movies[i+1].movieid;
				var thumbnail2 = self.imgURL + data.result.movies[i+1].thumbnail;
				var label2 = decode_utf8(data.result.movies[i+1].label.trunc(30));
				var plot2 = decode_utf8(data.result.movies[i+1].plot);
				var genre2 = decode_utf8(data.result.movies[i+1].genre);
				var playcount2 = data.result.movies[i+1].playcount;
				var mpaa2 = data.result.movies[i+1].mpaa;
				var rating2 = data.result.movies[i+1].rating;
				var runtime2 = data.result.movies[i+1].runtime;
				var year2 = data.result.movies[i+1].year;
				var resume2 = data.result.movies[i+1].resume;

				// Add to array to add to list in one go later
				self.movieList.push({
					s1: thumbnail,
					s2: thumbnail2,
					s3: label,
					s4: label2,
					s5: plot,
					s6: plot2,
					"d1" : {
						tokens: {
							"movieID": movieID,
							"resume": resume.position
						}
					},
					"d2" : {
						tokens: {
							"movieID": movieID2,
							"resume": resume2.position
						}
					},
					"s7" : (playcount > 0) ? 1 : 0, // sets watched/unwatched status
					"s8" : (playcount2 > 0) ? 1 : 0 // sets watched/unwatched status
				});
			}

			//CF.logObject(self.movieList);
			CF.listAdd("lxbmc_movieListing_list", self.movieList);
			//CF.setJoin("s"+baseJoin, "MOVIES " + "(" + data.result.limits.total + ")");				// Show Movie Text and Total Quantity
		});
	};

	self.playOrResumeMovie = function (movieID) {
		self.rpc("VideoLibrary.GetMovieDetails", {"movieid": parseInt(movieID, 10), "properties" : ["resume"]}, function(data) {
			// Use the resume point, automatically handled by playMovie function
			self.playMovie(data.result.moviedetails.movieid, data.result.moviedetails.resume.position);
		});
	};

	// Pass resume position to question user to resume or restart
	// Pass resume as 0 or false to start from beginning
	// Pass resume as true to start from resume point
	self.playMovie = function (movieID, resume) {
		if (resume > 0 && resume !== true) {
			// Present popup asking to resume or play from beginning
			CF.setJoins([
				{
					join: "xbmc_resume_counter",
					value: ("0"+Math.floor(resume/60)).slice(-2) + ":" + ("0"+resume%60).slice(-2)
				},
				{
					join: "xbmc_resume_doresume",
					tokens: {
						"movieID": movieID
					}
				},
				{
					join: "xbmc_resume_dorestart",
					tokens: {
						"movieID": movieID
					}
				}
			]);
			// Show popup
			CF.setProperties({join: "xbmc_resume_popup", opacity: 1}, 0, 0.1);
		} else {
			resume = resume === true; // Force a value of false if position of 0 is given
			// Hide popup
			CF.setProperties({join: "xbmc_resume_popup", opacity: 0}, 0, 0.1);
			self.rpc("Player.Open", {"item": { "movieid": parseInt(movieID, 10) }, "options" : { "resume": resume}});
		}
	};

	self.play = function() {
		self.rpc("Player.PlayPause", { "playerid" : 1});
	};

	self.stop = function() {
		self.rpc("Player.Stop", { "playerid" : 1});
	};

    self.next = function() {
        self.rpc("Player.GoTo", {"playerid": 1, "to": "next"});
    };

    self.previous = function() {
        self.rpc("Player.GoTo", {"playerid": 1, "to": "previous"});
    };

	self.seek = function(percentage) {
		self.seeking = true;
		self.rpc("Player.Seek", {"playerid": 1, "value": parseInt(percentage, 10)}, function(data) {
			self.seeking = false;
		});
	};

	// "smallforward"
	// "smallbackward"
	// "bigforward"
	// "bigbackward"
	self.jump = function(amount) {
		self.rpc("Player.Seek", {"playerid": 1, "value": amount});
	};

	// "increment"
	// "decrement"
	// 0
	// 100
	self.setVolume = function (level) {
		self.rpc("Application.SetVolume", {"volume": level});
	};

	self.getApplicationInfo = function() {
		self.rpc("Application.GetProperties", {"properties": ["volume", "muted", "version", "name"]}, function(data) {
			CF.setJoin("xbmc_volume_level", data.result.volume + "%");
		});
	};

	self.getPlayerInfo = function() {
		self.rpc("Player.GetProperties", {"playerid": 1, "properties": ["time", "totaltime", "speed", "percentage"]}, function(data) {
			self.currentlyPlaying.speed = data.result.speed;
			self.currentlyPlaying.time = data.result.time;
			self.currentlyPlaying.totaltime = data.result.totaltime;
			self.currentlyPlaying.percentage = data.result.percentage;
			if (self.currentlyPlaying.id == null) {
				self.rpc("Player.GetItem", {"playerid": 1, "properties": ["setid"]}, function(data) {
					self.currentlyPlaying.id = data.result.item.id;
					self.currentlyPlaying.type = data.result.item.type;
					if (self.currentlyPlaying.speed > 0) {
						self.startPolling();
					}
					if (typeof self.playStateChanged == "function") {
						self.playStateChanged(true);
					}
					if (typeof self.mediaChanged == "function") {
						self.mediaChanged(self.currentlyPlaying.id);
					}
				});
			} else {
				if (typeof self.playStateChanged == "function") {
					self.playStateChanged(true);
				}
			}
		});
	};

	self.processNotification = function (data) {
		var changed = false;
		if (data.params.data.item && data.params.data.item.id) {
			if (self.currentlyPlaying.id != data.params.data.item.id) {
				changed = true;
				self.currentlyPlaying.id = data.params.data.item.id;
			}
		}
		switch (data.method) {
			case "Playlist.OnClear" :
				self.stopPolling();
				CF.setJoin("xbmc_transport_play", "icon_large_loading_off.png");
				setTimeout(XBMCLoader.start, 200);
				break;
			case "Player.OnPlay" :
				XBMCLoader.stop();
				setTimeout(function() {
					CF.setProperties({join: "xbmc_transport_play", zrotation: 0}, 0, 0.1);
				}, 200);
				self.startPolling();
				self.currentlyPlaying.type = data.params.data.item.type;
				self.currentlyPlaying.speed = data.params.data.player.speed;
				if (typeof self.playStateChanged == "function") {
					self.playStateChanged(true);
				}
				break;
			case "Player.OnPause" :
				self.stopPolling();
				self.currentlyPlaying.type = data.params.data.item.type;
				self.currentlyPlaying.speed = data.params.data.player.speed;
				if (typeof self.playStateChanged == "function") {
					self.playStateChanged(changed);
				}
				break;
			case "Player.OnStop" :
				self.stopPolling();
				self.currentlyPlaying.type = data.params.data.item.type;
				self.currentlyPlaying.speed = -1;
				if (typeof self.playStateChanged == "function") {
					self.playStateChanged(changed);
				}
				break;
			case "Player.OnSeek" :
				self.currentlyPlaying.type = data.params.data.item.type;
				self.currentlyPlaying.speed = data.params.data.player.speed;
				self.currentlyPlaying.seekoffset = data.params.data.player.seekoffset;
				self.currentlyPlaying.time = data.params.data.player.time;
				if (typeof self.playStateChanged == "function") {
					self.playStateChanged(changed);
				}
				break;
			case "Application.OnVolumeChanged":
				CF.setJoin("xbmc_volume_level", data.params.data.volume + "%");
				break;
		}

		if (changed && typeof self.mediaChanged == "function") {
			self.mediaChanged(self.currentlyPlaying.id);
		}
	};

	self.startPolling = function() {
		if (!self.timerElapsed) {
			self.timerElapsed = setInterval(self.getPlayerInfo, 1000);
		}
	};

	self.stopPolling = function() {
		clearInterval(self.timerElapsed);
		self.timerElapsed = null;
	};

	self.updateURL();
	return self;
}

// HELPER FUNCTIONS

// Decoding string with accents
function decode_utf8(string) {
	return decodeURIComponent(escape(string));
}

String.prototype.trunc = String.prototype.trunc || function(n){
	return this.length>n ? this.substr(0,n-1)+'...' : this;
};