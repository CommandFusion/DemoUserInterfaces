var joinRange = {
	min: 10,
	max: 19
};

function setGaugeLevel(join) {
	var joinValues = [];
	var level = parseInt(join.substr(1), 10);
	for (var i=joinRange.min; i <= joinRange.max; i++) {
		joinValues.push({join: "d"+i, value: (i<=level) ? 1 : 0});
	}
	CF.setJoins(joinValues);
}