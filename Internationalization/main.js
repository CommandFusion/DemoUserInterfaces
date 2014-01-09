// Please excuse inaccuracies in translation - blame Google Translate!
var Locales = {
	"1" : {
		"name" : "en",
		"s100" : "Welcome",
		"s101" : "Hello",
		"s102" : "World"
	},
	"2" : {
		"name" : "de",
		"s100" : "Willkommen",
		"s101" : "Hallo",
		"s102" : "Welt"
	},
	"3" : {
		"name" : "br",
		"s100" : "Boas-vindas",
		"s101" : "Olá",
		"s102" : "Mundo"
	}
};

// Analog join to watch that triggers the locale changes
var localTrigger = "a1";

CF.userMain = function() {
	// Watch for a change to an analog join, which will trigger the locale change
	CF.watch(CF.JoinChangeEvent, localTrigger, function(j, v) {
		// Join has changed value, so lets	change the locale now.
		if (!Locales.hasOwnProperty(v)) {
			// Use default locale, first in the list, because there is no locale defined for the new analog join value
			v = 1;
		}

		var joinChanges = [];
		for (var prop in Locales[v]) {
			joinChanges.push({"join": prop, value: Locales[v][prop]});
		}
		CF.setJoins(joinChanges);
	});
}

function setLocale(name) {
	for (var locale in Locales) {
		if (Locales[locale].hasOwnProperty("name")) {
			if (Locales[locale].name == name) {
				CF.setJoin(localTrigger, locale);
			}
		}
	}
}