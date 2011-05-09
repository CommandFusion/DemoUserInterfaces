//Don't touch this line JSMD5-->2bf7f42de3c012d3eef32ecbe4117c1b<--JSMD5
/*======================================================================\
|               CommandFusion CBus Control JS Script                    |
|-----------------------------------------------------------------------|
| WARNING! Any changes made to this script WILL be overwritten whenever |
| new commands are generated.                                           |
\======================================================================*/

var cbus = {
    /*======================================================================\
    | namespace vars                                                        |
    \======================================================================*/
    baseJoin56: 4000,
    baseJoin202: 4100,
    bPercent: 1,

    /*======================================================================\
    | action selectors                                                      |
    \======================================================================*/


    /*======================================================================\
    | utility functions                                                     |
    \======================================================================*/
    levS: function (lev255) { return this.bPercent ? Math.ceil(lev255 / 2.55) + "%" : lev255; },
    levD: function (lev) { return lev == 0 ? 0 : 1; },
    hex2dec: function (hex) { parseInt(hex, 16); },
    dec2hexPair: function (dec) {
        var sOut = parseInt(dec).toString(16);
        if (sOut.length < 2) { sOut = "0" + sOut; }
        return sOut.toString().toUpperCase();
    },

    /*======================================================================\
    | setup: Initialise script                                              |
    \======================================================================*/
    setup: function () {
        CF.watch(CF.FeedbackMatchedEvent, "CBUS", "cbus network traffic", cbus.networkTraffic);
        CF.watch(CF.FeedbackMatchedEvent, "broadcast", "cbus broadcast traffic", cbus.broadcastTraffic);
    },

    /*======================================================================\
    | ramp: Get join, and send commands, update other via broadcast         |
    \======================================================================*/
    ramp: function (app, grp) {
        CF.getJoin("a" + (this["baseJoin" + app] + grp), function (join, value, tokens) {
            var joinIndex = parseInt(join.substr(1));
            var lvl = Math.ceil(parseInt(value) / 65535 * 255);
            CF.setJoins([
                { "join": "d" + joinIndex, "value": cbus.levD(lvl) },
                { "join": "s" + joinIndex, "value": cbus.levS(lvl) },
                //Analog join simulated locally, so don't need to set that.
                //{ "join": "a" + (this["baseJoin" + app] + grp), "value": newState * 65535 },
            ]);

            //Send command to cbus system
            var cmd = "\\05" + cbus.dec2hexPair(app) + "0002" + cbus.dec2hexPair(grp) + cbus.dec2hexPair(lvl);
            CF.send("CBUS", cmd + cbus.getChecksum(cmd) + "\x0D");

            //Send custom syntax to broadcast system to update any listening CF devices
            CF.send("broadcast", "cbus:" + cbus.dec2hexPair(app) + ":" + cbus.dec2hexPair(grp) + ":" + cbus.dec2hexPair(lvl) + ";");
        });
    },

    /*======================================================================\
    | toggle: Get join, and send commands, update other via broadcast       |
    \======================================================================*/
    toggle: function (app, grp) {
        CF.getJoin("a" + (this["baseJoin" + app] + grp), function (join, value, tokens) {
            var cmd;
            var joinIndex = parseInt(join.substr(1));
            var newState = 1 - Math.ceil(parseInt(value) / 65535);
            CF.setJoins([
                { "join": "d" + joinIndex, "value": newState },
                { "join": "s" + joinIndex, "value": cbus.levS(newState * 255) },
                { "join": "a" + joinIndex, "value": newState * 65535 },
            ]);
            cmd = "\\05" + cbus.dec2hexPair(app) + "00" + cbus.dec2hexPair((newState * 120) + 1) + cbus.dec2hexPair(grp);

            //Send command to cbus system
            CF.send("CBUS", cmd + cbus.getChecksum(cmd) + "\x0D");

            //Send custom syntax to broadcast system to update any listening CF devices
            CF.send("broadcast", "cbus:" + cbus.dec2hexPair(app) + ":" + cbus.dec2hexPair(grp) + ":" + cbus.dec2hexPair(newState * 255) + ";");
        });
    },
    
    /*======================================================================\
    | scene: Set digital join for selected scene, clear any set joins for   |
    |        other action selectors (scenes) in this trigger group.         |
    \======================================================================*/
    scene: function (app, group, scene) {
        var tg = this["triggerGroup" + group];

        for (var as in tg) {
            var on = 0;
            if (tg[as] == scene) { on = 1; }
            CF.setJoin("d" + (this["baseJoin" + app] + group) + cbus.alz(tg[as],3), on);
        }

        //Send command to cbus system
        var cmd = "\\05" + cbus.dec2hexPair(app) + "0002" + cbus.dec2hexPair(group) + cbus.dec2hexPair(scene);
        CF.send("CBUS", cmd + cbus.getChecksum(cmd) + "\x0D");

        //Send custom syntax to broadcast system to update any listening CF devices
        CF.send("broadcast", "cbus:" + cbus.dec2hexPair(app) + ":" + cbus.dec2hexPair(group) + ":" + cbus.dec2hexPair(scene) + ";");
    },

    /*======================================================================\
    | networkTraffic: Triggered by feedback for anything (".*") sent to the |
    |                 CBus system                                           |
    \======================================================================*/
    networkTraffic: function (itemName, matchedString) { cbus.doNetworkTraffic(matchedString); },
    doNetworkTraffic: function (sIn) {
        sIn = sIn.replace(/(\r\n)/g, "");
        var len = sIn.length - 2;
        if (sIn.substr(len).toUpperCase() == cbus.getChecksum(sIn.substr(0, len))) {
            sIn = sIn.substr(0, len);
            if (!(sIn.match("86FEFE00F[79]07") == null)) {
                cbus.netStatusResponse(sIn);
            } else if (!(sIn.match("^05..38*") == null)) {
                cbus.netMsg56(sIn);
            } else if (!(sIn.match("^05..CA*") == null)) {
                cbus.netMsg202(sIn);
            }
        } else {
            CF.log("CBus Checksum Error: Expected '" + cbus.getChecksum(sIn.substr(0, len)) + "', received '" + sIn.substr(len)) + "'";
        }
    },
	
    /*======================================================================\
    | netMsg202: Process messages from application 202 (hex:CA)             |
    \======================================================================*/
    netMsg202: function (sIn) {
        //05FDCA0105010FB0
        var grp, lvl;
        var i = 2;
        var unit = parseInt(sIn.substr(i, 2), 16); i += 2;
        var app = parseInt(sIn.substr(i, 2), 16); i += 2;
        i += (parseInt(sIn.substr(i, 2), 16) + 1) * 2;
        while (i < sIn.length) {
            if (sIn.substr(i, 2) == "01") {
                //min
                grp = parseInt(sIn.substr(i + 2, 2), 16);
                lvl = 0;
                i += 4;
            } else if (sIn.substr(i, 2) == "79") {
                //max
                grp = parseInt(sIn.substr(i + 2, 2), 16);
                lvl = 255;
                i += 4;
            } else if ("7A,72,6A,62,5A,52,4A,42,3A,32,2A,22,1A,12,0A,02".indexOf(sIn.substr(i, 2)) >= 0) {
                //actionselector
                grp = parseInt(sIn.substr(i + 2, 2), 16);
                lvl = parseInt(sIn.substr(i + 4, 2), 16);
                i += 6;
            } else if (sIn.substr(i, 2) == "09") {
                //led off
                grp = parseInt(sIn.substr(i + 2, 2), 16);
                lvl = -1;
                i += 4;
            } else {
                //abort on anything else
                i = sIn.length;
            }
			
            var tg = this["triggerGroup" + grp];
            for (var as in tg) {
            var on = 0;
            if (tg[as] == lvl) { on = 1; }
                CF.setJoin("d" + (this["baseJoin" + app] + grp) + cbus.alz(tg[as],3), on);
            }
        }
    },

    /*======================================================================\
    | netMsg56: Process messages from application 56 (hex:38)               |
    \======================================================================*/
    netMsg56: function (sIn) {
        //05FD380105010FB0
        var grp, lvl;
        var i = 2;
        var unit = parseInt(sIn.substr(i, 2), 16); i += 2;
        var app = parseInt(sIn.substr(i, 2), 16); i += 2;
        i += (parseInt(sIn.substr(i, 2), 16) + 1) * 2;
        while (i < sIn.length) {
            if (sIn.substr(i, 2) == "01") {
                //off
                grp = parseInt(sIn.substr(i + 2, 2), 16);
                lvl = 0;
                i += 4;
            } else if (sIn.substr(i, 2) == "79") {
                //on
                grp = parseInt(sIn.substr(i + 2, 2), 16);
                lvl = 255;
                i += 4;
            } else if ("7A,72,6A,62,5A,52,4A,42,3A,32,2A,22,1A,12,0A,02".indexOf(sIn.substr(i, 2)) >= 0) {
                //ramp
                grp = parseInt(sIn.substr(i + 2, 2), 16);
                lvl = parseInt(sIn.substr(i + 4, 2), 16);
                i += 6;
            } else {
                //abort on anything else
                i = sIn.length;
            }
            CF.setJoins([
                { "join": "d" + (this["baseJoin" + app] + grp), "value": cbus.levD(lvl) },
                { "join": "s" + (this["baseJoin" + app] + grp), "value": cbus.levS(lvl) },
                { "join": "a" + (this["baseJoin" + app] + grp), "value": lvl * (65535 / 255) },
            ]);
        }
    },

    /*======================================================================\
    | netStatusResponse: Process messages received from a level mmi         |
    \======================================================================*/
    netStatusResponse: function (sIn) {
        //trim header
        sIn = sIn.substr(12);

        //get the application, then trim it off
        var app = parseInt(sIn.substr(0, 2), 16);
        sIn = sIn.substr(2);

        //get first group, then trim it off the start
        var grp = parseInt(sIn.substr(0, 2), 16);
        sIn = sIn.substr(2);

        //lookup code to decode level - kudos to Florent (fpillet)
        var nibbles = "AA A9 A6 A5 9A 99 96 95 6A 69 66 65 5A 59 56 55 ";
        for (var i = 0; i < sIn.length; i += 4) {
            var lvl = nibbles.indexOf(sIn.substr(i, 2) + " ") / 3 + ((nibbles.indexOf(sIn.substr(i + 2, 2) + " ") / 3) << 4);
            if (lvl >= 0) {
                CF.setJoins([
                    { "join": "d" + (this["baseJoin" + app] + grp), "value": cbus.levD(lvl) },
                    { "join": "s" + (this["baseJoin" + app] + grp), "value": cbus.levS(lvl) },
                    { "join": "a" + (this["baseJoin" + app] + grp), "value": lvl * (65535 / 255) },
                ]);
            }
            grp++;
        }
    },

    /*======================================================================\
    // broadcastTraffic: Triggered by feedback for anything sent to the     |
    //                   broadcast system starting with "cbus:"             |
    \======================================================================*/
    broadcastTraffic: function (itemName, matchedString) { cbus.doBroadcastTraffic(matchedString); },
    doBroadcastTraffic: function (matchedString) {
        if (matchedString.substr(0, 5) == "cbus:") {
            var app = parseInt(matchedString.substr(5, 2), 16);
            var grp = parseInt(matchedString.substr(8, 2), 16);
            var lvl = parseInt(matchedString.substr(11, 2), 16);
            if ( app == 56 ) {
                CF.setJoins([
                    { "join": "d" + (this["baseJoin" + app] + grp), "value": cbus.levD(lvl) },
                    { "join": "s" + (this["baseJoin" + app] + grp), "value": cbus.levS(lvl) },
                    { "join": "a" + (this["baseJoin" + app] + grp), "value": lvl * (65535 / 255) },
                ]);
            } else if ( app == 202 ) {
                var tg = this["triggerGroup" + grp];
                for (var as in tg) {
                    var on = 0;
                    if (tg[as] == lvl) { on = 1; }
                    CF.setJoin("d" + (this["baseJoin" + app] + grp) + cbus.alz(tg[as],3), on);
                }
            }
        }
    },

    /*======================================================================\
    | getChecksum: Calculates and returns checksum in uppercase as per CBus |
    |              serial documentation                                     |
    \======================================================================*/
    getChecksum: function (sInput) {
        if (sInput.substring(0, 1) == "\\") { sInput = sInput.substring(1); }
        if (sInput.length % 2) { return 0; }
        var i = 0;
        var iSum = 0;
        var iLimit = sInput.length / 2;
        for (i = 0; i < iLimit; i++) {
            iSum = iSum + parseInt(sInput.substr(i * 2, 2), 16);
        }
        iSum %= 256; // modulo 256
        iSum = 256 - iSum; // 2"s complement 
        var sRet = cbus.alz((iSum).toString(16).toUpperCase(),2);
        return sRet.substr(sRet.length-2,2);
    },

    /*======================================================================\
    | format: Provides printf-type multi string replacemetns                |
    |         eg. format("test{1}{0}",2,3)); would produce "test32"         |
    \======================================================================*/
    format: function (str) {
        for (i = 1; i < arguments.length; i++) {
            str = str.replace("{" + (i - 1) + "}", arguments[i]);
        }
        return str;
    },

    /*======================================================================\
    | alz: Adds the specified number of leading zeros and returns str       |
    \======================================================================*/
    alz: function (str,len) {
        while (str.toString().length < len){ str = "0" + str; }
        return str.toString();
    },

    /*======================================================================\
    | log: Only allow logging calls when CF is in debug mode - better       |
    |      performance in release mode this way.                             |
    \======================================================================*/
    log: function(msg) {
        if (CF.debug) {
            CF.log(msg);
        }
    }
};

/*======================================================================\
| iViewer Entry Function                                                |
\======================================================================*/
CF.modules.push({name:"cbus", setup:cbus.setup});

/*======================================================================\
|                             END OF FILE                               |
\======================================================================*/