var origin = { x: 0, y: 0, w: 0, h: 0 };
var toggleGroup = ["s1", "s2", "s3", "s4", "s5", "s6"];
var showAll;
function toggleFullscreen(join) {
	CF.getProperties(join, function(props) {
		if (props.x == 0) {
			if (!showAll) {
				var showAll = [];
				for (var i in toggleGroup) {
					showAll.push({join: toggleGroup[i], opacity: 1.0});
				}	
			}
			// We are already in fullscreen mode, scale the object back to original state
			CF.setProperties({join: props.join, x: origin.x, y: origin.y, w: origin.w, h: origin.h}, 0.0, 0.3, CF.AnimationCurveLinear, function() {
				// Now show all the objects in the toggle group
				CF.setProperties(showAll, 0.0, 0.2);
			});
		} else {
			// We are in small window mode
			// Store the original position so we can toggle back to it
			origin = props;
			// Hide all other objects in the toggle group
			var hideObjects = [];
			for (var i in toggleGroup) {
				var j = toggleGroup[i];
				if (join != j) hideObjects.push({join: j, opacity: 0.0});
			}
			CF.setProperties(hideObjects);
			// Scale the object
			CF.setProperties({join: props.join, x: 0, y: 0, w: 1024, h: 768, opacity: 1}, 0.0, 0.3); // Last param is the animation time
		}
	});
}