// ======================================================================
// Menu Manager Object
// ======================================================================

var MenuManager = {
	// ======================================================================
	// Constant vars
	// ======================================================================

	TOTAL_ITEMS:				5,
	MENU_START_JOIN:			10001,
	SOUND_JOIN:					20000,

	setup: function () {
		MenuManager.log("MenuManager Setup Started.");
		var items = [];
		// Setup each menu items starting state
		for (var i = MenuManager.MENU_START_JOIN; i<=MenuManager.TOTAL_ITEMS + MenuManager.MENU_START_JOIN; i++) {
			items.push({join: "d"+i, opacity: 0.0, scale: 0.2});	// button
			items.push({join: "s"+i, opacity: 0.0, scale: 2.0});	// icon image
			items.push({join: "s"+(i+100), opacity: 0.0, scale: 2.0});	// text image
		}
		CF.setProperties(items); // Actually hide the items

		// Watch video event for intro vid
		CF.watch(CF.MoviePlaybackStateChangedEvent, "s9999", MenuManager.videoChangedReceived);

		MenuManager.log("MenuManager Setup Complete.");
	},

	videoChangedReceived: function(join, info) {
		// Automatically hide the video once it has finished playing.
		CF.log(debugProcessMessage(info,3));
		if (info.finished) {
			MenuManager.animateMenuIn();
		}
	},

	hideIntroVideo: function() {
		// Hide the video
		CF.setProperties({join: "s9999", opacity: 0.0}, 0.0, 0.3);
		// Stop video playback
		CF.setJoin("d9999", 1);
	},

	animateMenuIn: function () {
		MenuManager.setup();
		MenuManager.hideIntroVideo();
		// Show each menu item, one by one
		MenuManager.animateItemIn(0);
	},

	// Start animating a menu item onto screen
	animateItemIn: function (item) {
		// Play sound
		CF.setJoin("d"+(MenuManager.SOUND_JOIN+item+1), 1);
		var i = item; // Save reference for setTimeout access because we need to increment it before setTimeout could access it
		// Animate the button image, then repeat to the next menu item after 200ms if more items exist
		CF.setProperties({join: "d"+(item+MenuManager.MENU_START_JOIN), opacity: 1.0, scale: 1.25}, 0.0, 0.15, CF.AnimationCurveEaseOut, function () {
			CF.setProperties({join: "d"+(item+MenuManager.MENU_START_JOIN), opacity: 1.0, scale: 1.0}, 0.0, 0.1, CF.AnimationCurveEaseIn);
		});
		// Start next menu item animation 200ms after each other
		if ((i+1) < MenuManager.TOTAL_ITEMS) {
			setTimeout(function () {MenuManager.animateItemIn(item+1)}, 200);
		}

		// Animate the icon image with a little bounce in
		// Start 200ms after the button has begun animating
		setTimeout(function () {
			CF.setProperties({join: "s"+(item+MenuManager.MENU_START_JOIN), opacity: 1.0, scale: 0.8}, 0.0, 0.3, CF.AnimationCurveEaseOut, function () {
				CF.setProperties({join: "s"+(item+MenuManager.MENU_START_JOIN), scale: 1.05}, 0.0, 0.15, CF.AnimationCurveEaseIn, function () {
					CF.setProperties({join: "s"+(item+MenuManager.MENU_START_JOIN), scale: 0.95}, 0.0, 0.15, CF.AnimationCurveEaseOut, function () {
						CF.setProperties({join: "s"+(item+MenuManager.MENU_START_JOIN), scale: 1.0}, 0.0, 0.15, CF.AnimationCurveEaseIn);
					});
				});
			});
		}, 200);

		// Animate the text label for the menu item after 400ms
		setTimeout(function () {
			CF.setProperties({join: "s"+(item+MenuManager.MENU_START_JOIN+100), opacity: 1.0, scale: 0.7}, 0.0, 0.3, CF.AnimationCurveEaseOut, function () {
				CF.setProperties({join: "s"+(item+MenuManager.MENU_START_JOIN+100), opacity: 1.0, scale: 1.0}, 0.0, 0.15, CF.AnimationCurveEaseIn);
			});
		}, 400);
	},
	// Item selected in menu, animate it out and do a page flip
	selectItem: function (item, pageName) {
		CF.setProperties([{join: "s"+(item+MenuManager.MENU_START_JOIN+100), opacity: 1.0, scale: 1.2},{join: "s"+item, opacity: 1.0, scale: 1.2},{join: "d"+item, opacity: 1.0, scale: 1.2}], 0.0, 0.2, CF.AnimationCurveEaseOut, function () {
			CF.setProperties([{join: "s"+(item+MenuManager.MENU_START_JOIN+100), opacity: 0.0, scale: 0.2},{join: "s"+item, opacity: 0.0, scale: 0.2},{join: "d"+item, opacity: 0.0, scale: 0.2}], 0.0, 0.15, CF.AnimationCurveEaseIn, function() {
				// Flip to the correct page
				if (pageName !== undefined) {
					CF.flipToPage(pageName);
				}
			});
		});
	},

	pressItem: function (join) {
		// Get the join number
		var item = parseInt(join.substr(1));
		CF.setProperties([{join: "s"+(item+100), opacity: 1.0, scale: 1.2},{join: "s"+item, opacity: 1.0, scale: 1.2},{join: "d"+item, opacity: 1.0, scale: 1.2}], 0.0, 0.2, CF.AnimationCurveEaseOut);
	},
	
	releaseItem: function (join, pageName) {
		// Get the join number
		var item = parseInt(join.substr(1));
		CF.setProperties([{join: "s"+(item+100), opacity: 0.0, scale: 0.2},{join: "s"+item, opacity: 0.0, scale: 0.2},{join: "d"+item, opacity: 0.0, scale: 0.2}], 0.0, 0.15, CF.AnimationCurveEaseIn, function() {
			// Flip to the correct page
			if (pageName !== undefined) {
				CF.flipToPage(pageName);
			}
		});
		// Play sound
		CF.setJoin("d"+MenuManager.SOUND_JOIN, 1);
	},

	// Only allow logging calls when CF is in debug mode - better performance in release mode this way
	log: function(msg) {
		if (CF.debug) {
			CF.log(msg);
		}
	}
}

CF.modules.push({name:"MenuManager", setup:MenuManager.setup});