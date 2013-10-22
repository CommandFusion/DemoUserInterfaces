CF.userMain = function() {
	setInterval(updateClock, 1000);
};

function updateClock() {
	var now = new Date();
	var hour = now.getHours(), min = now.getMinutes(), sec = now.getSeconds();

	CF.setProperties({join: "s1", zrotation: (hour * 30) + (min / 10)});
	CF.setProperties({join: "s2", zrotation: (min * 6) + (sec / 10)});
	CF.setProperties({join: "s3", zrotation: sec * 6});
}