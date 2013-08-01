var PassLock = {
	displayJoin: "s1",
	maskChar: "*",
	enteredData: "",
	correctPass: "",
	pageFlip: "",

	setup: function() {
		CF.getJoin(CF.GlobalTokensJoin, function(j,v,t){
			PassLock.correctPass = t["[password]"];
			PassLock.pageFlip = t["[passSuccessPage]"];
		});
	},

	clear: function() {
		PassLock.enteredData = "";
		PassLock.checkPass();
	},

	keyPress: function(key) {
		if (PassLock.enteredData.length == PassLock.correctPass.length) {
			PassLock.enteredData = "";
		}
		PassLock.enteredData = PassLock.enteredData + key;
		PassLock.checkPass();
	},

	checkPass: function() {
		if (PassLock.maskChar != "") {
			CF.setJoin(PassLock.displayJoin, Array(PassLock.enteredData.length + 1).join(PassLock.maskChar));
		} else {
			CF.setJoin(PassLock.displayJoin, PassLock.enteredData);
		}
		
		if (PassLock.enteredData == PassLock.correctPass) {
			PassLock.enteredData = "";
			CF.setProperties({join: PassLock.displayJoin, opacity: 0.0, scale: 3.0}, 0.1, 0.2, CF.AnimationCurveEaseOut, function() {
				CF.setJoin(PassLock.displayJoin, "");
				CF.flipToPage(PassLock.pageFlip);
				CF.setProperties({join: PassLock.displayJoin, opacity: 1.0, scale: 1.0}, 0.1);
			});
		} else if (PassLock.enteredData.length == PassLock.correctPass.length) {
			CF.setProperties({join: PassLock.displayJoin, opacity: 0.1}, 0.0, 0.2, CF.AnimationCurveLinear, function() {
				CF.setProperties({join: PassLock.displayJoin, opacity: 0.8}, 0.0, 0.2, CF.AnimationCurveLinear, function() {
					CF.setProperties({join: PassLock.displayJoin, opacity: 0.0}, 0.0, 0.2, CF.AnimationCurveLinear, function() {
						CF.setJoin(PassLock.displayJoin, "");
						CF.setProperties({join: PassLock.displayJoin, opacity: 1.0}, 0.1);
					});
				});
			});
		}
	},
};

CF.modules.push({
	name: "PassLock",       // the name of the module (mostly for display purposes)
	setup: PassLock.setup,  // the setup function to call
	object: PassLock,       // the object to which the setup function belongs ("this")
	version: 1.0            // An optional module version number that is displayed in the Remote Debugger
});