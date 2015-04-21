var monitor;

// Remember! Only ONE CF.userMain call per project. Merge them into one call if you have other scripts already calling CF.userMain
CF.userMain = function () {
	// Single SSID
	//monitor = new NetworkMonitor({ssid: "linksys", systemName: "my system", remoteIP: "my.dyndns.org", remotePort: 1234}).init();

	// Multiple SSIDs as string
	//monitor = new NetworkMonitor({ssid: "linksys, home, home2", systemName: "my system", remoteIP: "my.dyndns.org", remotePort: 1234}).init();

	// Multiple SSIDs as array
	//monitor = new NetworkMonitor({ssid: ["linksys", "home", "home2"], systemName: "my system", remoteIP: "my.dyndns.org", remotePort: 1234}).init();

	// Or with a function to call dynamic code when network is unavailable:
	monitor = new NetworkMonitor({
		ssid: "BELL",
		systemName: "My System",
		remoteIP: "my.dyndns.org",
		remotePort: 1234,
		statusJoin: "monitor_tag",
		networkChangeCallback: function(networkStatus) {
			// Network status changed, run your own code
			CF.log("CALLBACK!");
			CF.logObject(networkStatus);

			// Show or hide a subpage assigned to a tag 'networkUnavailable' based on network state.
			CF.setJoin("networkUnavailable", !networkStatus.hasNetwork);
		}
	}).init();
};