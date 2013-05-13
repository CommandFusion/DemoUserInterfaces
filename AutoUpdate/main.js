/*
// Using GitHub, needs two URLs - one to check the headers, one to download the GUI content
var AutoUpdater = new AutoUpdate({
	fileURLCheck: "https://api.github.com/repos/CommandFusion/DemoUserInterfaces/contents/AutoUpdate/autoupdate.gui",
	fileURL: "https://raw.github.com/CommandFusion/DemoUserInterfaces/master/AutoUpdate/autoupdate.gui",
	updateAvailable: updateAvailable,
	alreadyUpdated: alreadyUpdated,
	checkingForUpdate: checkingForUpdate
});
*/

// Using Dropbox, needs just one URL, a public URL to the raw file download. You must use project archives (Zip files) if hosting on dropbox.
var AutoUpdater = new AutoUpdate({
	fileURL: "https://dl.dropboxusercontent.com/u/8790585/AutoUpdateDemo/autoupdate.zip",
	updateAvailable: updateAvailable,
	alreadyUpdated: alreadyUpdated,
	checkingForUpdate: checkingForUpdate
});

// Remember to only have a single CF.userMain function defined in your entire project.
// Merge with the contents of your existing CF.userMain function if you already have one defined for other scripts.
CF.userMain = function() {
	// Check for updates immediately on launch.
	// This also sets up the automated checks every x seconds.
	AutoUpdater.checkForUpdate();
};

// alwaysConfirm is a boolean value, used to identify a manual check rather than an automated check every x seconds.
// In our case we only want to show the checking status when doing a manual check, automated checks will happen discretely in the background.
function checkingForUpdate(alwaysConfirm) {
	if (alwaysConfirm) {
		CF.setJoin("s2", "checking...");
	}
}

// An update is available, so show the user a subpage with options to update or cancel.
// Change this to reflect your GUI requirements.
function updateAvailable() {
	CF.setJoins([{join: "d1", value: 1}, {join: "d2", value: 0}]);
}

// The GUI is already up to date, just let the user know (change this to reflect your GUI requirements).
// This callback is only called if the user performed a manual check (automated checks will not give callbacks unless a new GUI is available)
function alreadyUpdated() {
	CF.setJoins([{join: "d1", value: 0}, {join: "d2", value: 1}]);
}

// Just some code to hide the subpages, change this to reflect your GUI requirements
function cancelPopups() {
	CF.setJoins([{join: "d1", value: 0}, {join: "d2", value: 0}, {join: "d3", value: 0}, {join: "s2", value: ""}]);
}

// Some code to force the server to update the GUI file just for this example, to simulate a new GUI is available.
// The server updates the dropbox file to change the "Last Updated:" text in the GUI, then rezips it and uploads to dropbox to simulate a new GUI being available.
function forceUpdate() {
	CF.setJoin("d3", 1);
	CF.request("http://www.commandfusion.com/cron/autoupdatedemo", function(status) {
		cancelPopups();
	});
}