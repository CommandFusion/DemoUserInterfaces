// Final URL https://api.github.com/repos/CommandFusion/DemoUserInterfaces/contents/AutoUpdate/autoupdate.gui
var AutoUpdater = new AutoUpdate({fileURL: "https://api.github.com/repos/CommandFusion/DemoUserInterfaces/contents/AutoUpdate/autoupdate.gui", updateAvailable: updateAvailable, alreadyUpdated: alreadyUpdated});

CF.userMain = function() {
	// Check for updates immediately on launch
	AutoUpdater.checkForUpdate();
};

function updateAvailable() {
	CF.setJoins([{join: "d1", value: 1}, {join: "d2", value: 0}]);
}

function alreadyUpdated() {
	CF.setJoins([{join: "d1", value: 0}, {join: "d2", value: 1}]);
}

function cancelPopups() {
	CF.setJoins([{join: "d1", value: 0}, {join: "d2", value: 0}]);
}