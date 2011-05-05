var AirLive = {
	IPAddress:		"192.168.0.81",
	controlPort:	8100,
	username:		"admin",
	password:		"airlive",
	authString:		null,
	lastZoomScale:	0.0,
	lastRotation:	0.0,
	
	setup: function () {
		// Setup AirLive
		AirLive.log("AirLive Setup Started.");
		AirLive.log("AirLive Setup Complete.");
	},
	pinchZoom: function(gesture) {
		AirLive.log("Scale: "+gesture.scale);
		var scaleDiff = AirLive.lastZoomScale - gesture.scale;
		AirLive.log("Diff: "+scaleDiff);
		if (scaleDiff > 0.1 || scaleDiff < -0.1) {
			//AirLive.zoom(scaleDiff*10);
			AirLive.lastZoomScale = gesture.scale;
		}
	},
	// Continuously Pan the camera whilst rotating, until gesture ends.
	rotate: function(gesture) {
		// Convert radians to degrees
		var degrees = (gesture.rotation)*(180/Math.PI);
		var rotateDiff = Math.round(degrees - AirLive.lastRotation);
		// If we have rotated more than 10 degrees, send to camera
		if (rotateDiff > 10 || rotateDiff < -10) {
			//CF.log(rotateDiff);
			AirLive.panContinuous(rotateDiff);
			AirLive.lastRotation = degrees;
		}
	},
	rotateEnd: function(gesture) {
		AirLive.lastRotation = 0.0;
		AirLive.panContinuous(0);
	},
	centerImage: function(gesture) {
		AirLive.log(gesture.x+","+gesture.y);
		AirLive.sendMsg({"center": gesture.x+","+gesture.y, "imagewidth": 640, "imageheight": 480});
	},
	// Direction must be one of: home, up, down, left, right, upleft, upright, downleft, downright
	move: function(direction) {
		AirLive.sendMsg({"move":direction});
	},
	moveUp: function() {
		AirLive.sendMsg({"move":"up"});
	},
	moveDown: function() {
		AirLive.sendMsg({"move":"down"});
	},
	moveLeft: function() {
		AirLive.sendMsg({"move":"left"});
	},
	moveRight: function() {
		AirLive.sendMsg({"move":"right"});
	},
	moveHome: function() {
		AirLive.sendMsg({"move":"home"});
	},
	panContinuous: function(amount) {
		AirLive.sendMsg({"continuouspantiltmove":amount+",0"});
	},
	panAbsolute: function(amount) {
		AirLive.sendMsg({"pan":amount});
	},
	panRelative: function(amount) {
		AirLive.sendMsg({"rpan":amount});
	},
	zoom: function(amount) {
		AirLive.log("Zoom: "+amount);
		AirLive.sendMsg({"rzoom":amount});
	},
	appendBasicAuth: function() {
		AirLive.authString = "Basic "+btoa(AirLive.username+":"+AirLive.password);
		//CF.log(AirLive.authString);
	},
	sendMsg: function(params) {
		if (AirLive.authString == null) {
			AirLive.appendBasicAuth();
		}
		var paramFormatted = [];
		// Convert object literal to an array ready to be joined into URL query string format
		for (var prop in params) {
			if (params.hasOwnProperty(prop)) {
				paramFormatted.push(prop+"="+encodeURIComponent(params[prop]));
			}
		}
		//CF.log("http://"+AirLive.IPAddress+":"+AirLive.controlPort+"/com/ptz.cgi?"+paramFormatted.join("&"));
		CF.request("http://"+AirLive.IPAddress+":"+AirLive.controlPort+"/com/ptz.cgi?"+paramFormatted.join("&"), "GET", {"Authorization": AirLive.authString}, function (status, headers, body) {
			//CF.log(status);
		});
	},
	// Only allow logging calls when CF is in debug mode - better performance in release mode this way
	log: function(msg) {
		if (CF.debug) {
			CF.log(msg);
		}
	}
}

CF.modules.push({name:"AirLive", setup:AirLive.setup});