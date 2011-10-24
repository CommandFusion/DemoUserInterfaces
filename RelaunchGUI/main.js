CF.userMain = function () {
	CF.watch(CF.JoinChangeEvent, "d1234567", function (j,v) {
		if (v == "1") {
			CF.openURL("cf://192.168.0.10:8019");
		}
	});
};