function refreshInfo() {
	CF.setJoins([
		{
			join: "s1",
			value: CF.device.platform
		},
		{
			join: "s2",
			value: CF.device.version
		},
		{
			join: "s3",
			value: CF.device.model
		},
		{
			join: "s4",
			value: CF.device.uuid
		},
		{
			join: "s5",
			value: CF.device.name
		},
		{
			join: "s6",
			value: CF.ipv4address
		},
		{
			join: "s7",
			value: CF.MACaddress
		},
		{
			join: "s8",
			value: CF.currentOrientation
		}
	]);

}

CF.userMain = function() {
	refreshInfo();
};