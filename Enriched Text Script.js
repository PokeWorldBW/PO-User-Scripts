//basic script to allow enriched text on PO Version 2.0 since it was removed in the latest update. Still not perfect, but it's getting there I guess
//commands are "~etext on" and "~etext off" which will turn enriched text on/off and "~greentext on", "~greentext off", which will turn greentext on/off
//currently needs 2.0.05 to fix channel links
var auth_symbol = {
    "0": "",
    "1": "+",
    "2": "+",
    "3": "+",
    "4": ""
    //change these to what you have set yourself and more if needed using the format "x": "symbol",
}
var auth_style = {
    "0": "<b>",
    "1": "<i><b>",
    "2": "<i><b>",
    "3": "<i><b>",
    "4": "<b>"
    //change this to the style you have set, only start tags are needed
}
var hilight = "BACKGROUND-COLOR: #ffff00" //change this if you want a different hilight colour when pinged (leave background there unless you want a different style)
var fontcolour = "#000000" //change this for different font colours
var fontstyle = "" //this changes the font type of your text, leave it blank for default
var fontsize = 3 //this changes the font size of your text, 3 is default
var greentext = '#789922' //changes the text when someone quotes with ">" at the start
var punctuation = [".", ",", "\"", "'", "&", ";", ":"] //list of common punctuation, increase or decrease as you see fit
//these things below shouldn't be touched unless you know what you're doing~
function init() {
        if (sys.getVal('etext') === "true") {
            etext = "true"
        } else {
            etext = "false"
        }
        if (sys.getVal('tgreentext') === "true") {
            tgreentext = "true"
        } else {
            tgreentext = "false"
        }
    }
init()
poScript = ({
    clientStartUp: function () {
        init()
    },
    html_escape: function (text) {
        var m = String(text);
        if (m.length > 0) {
            var amp = "&am" + "p;";
            var lt = "&l" + "t;";
            var gt = "&g" + "t;";
            return m.replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt);
        } else {
            return "";
        }
    },
    authEnd: function (string) {
        newstring = string.replace(/</g, "</")
        return newstring
    },
    channelLinks: function (string) {
        var channels = client.channelNames()
        var newstring = string
        for (x in channels) {
            if (string.toLowerCase().indexOf("#" + channels[x].toLowerCase()) != -1) {
                var channel = new RegExp("#" + channels[x], "i")
                newstring = string.replace(channel, '<a href="po:join/' + channels[x] + '">#' + channels[x] + "</a>")
            }
        }
        return newstring
    },
    beforeChannelMessage: function (message, chan, html) {
        var pos = message.indexOf(': ');
        if (pos != -1) {
            if (client.id(message.substring(0, pos)) == -1) {
                return;
            }
            var id = client.id(message.substring(0, pos))
            var playname = message.substring(0, pos)
            var playmessage = this.html_escape(message.substr(pos + 2))
            var msg = playmessage.split(' ')
            for (x in msg) {
                var msgnew, otherend
                var msgl = msg[x].length
                var start = msg[x][0]
                var end = msg[x][parseInt(msgl - 1)]
                for (y in punctuation) {
                    if (start == punctuation[y]) {
                        start = msg[x][1]
                    }
                    if (end == punctuation[y]) {
                        end = msg[x][parseInt(msgl - 2)]
                        otherend = punctuation[y]
                    }
                }
                 if (msg[x].substr(0, 7) == "http://" || msg[x].substr(0, 8) == "https://") {
                    var link = msg[x]
					link = link.replace(/&amp;/g, "&")
                    msgnew = "<a href = '" + link + "'>" + link + "</a>"
                    playmessage = playmessage.replace(msg[x], msgnew)
                }
                if (((start == "*" && end == "*" && msgl > 2) || ((start == "/" || start == "\\") && (end == "/" || end == "\\") && msgl > 2) || (start == "_" && end == "_" && msgl > 2)) && etext === "true") {
                    var modifier, endmodifier, newmsg
                    if (start == "*") {
                        modifier = "<b>"
                        endmodifier = "</b>"
                    }
                    if (start == "/" || start == "\\") {
                        modifier = "<i>"
                        endmodifier = "</i>"
                    }
                    if (start == "_") {
                        modifier = "<u>"
                        endmodifier = "</u>"
                    }
                    var i = msg[x].lastIndexOf(end)
                    if (i >= 0) {
                        newmsg = msg[x].substring(0, i) + endmodifier + (otherend == undefined ? "" : otherend)
                    }
                    msgnew = newmsg.replace(start, modifier)
                    playmessage = playmessage.replace(msg[x], msgnew)
                }
            }
            var colour = client.color(id)
            if (colour === "#000000") {
                var clist = ['#5811b1', '#399bcd', '#0474bb', '#f8760d', '#a00c9e', '#0d762b', '#5f4c00', '#9a4f6d', '#d0990f', '#1b1390', '#028678', '#0324b1'];
                colour = clist[src % clist.length];
            }
            if (playmessage.toLowerCase().indexOf(client.ownName().toLowerCase()) != -1 && playname !== client.ownName()) {
                var name = new RegExp("\\b" + client.ownName() + "\\b", "i")
                newplaymessage = playmessage.replace(name, "<span style='" + hilight + "'>" + client.ownName() + "</span>")
                if (newplaymessage !== playmessage) {
                    playmessage = newplaymessage.replace(newplaymessage, "<i> " + newplaymessage + "</i><ping/>")
                }
            }
            if (playmessage.substr(0, 4) == "&gt;" && tgreentext === "true") {
                playmessage = "<font color = '" + greentext + "'>" + playmessage + "</font>"
            } else {
                playmessage = "<font color = '" + fontcolour + "'>" + playmessage
            }
            var symbolLength = 0
            for (x in auth_symbol) {
                if (x > symbolLength) {
                    symbolLength = x
                }
            }
            var auth = client.auth(id)
            if (auth > symbolLength) {
                auth = 0
            }
            playmessage = this.channelLinks(playmessage)
            client.printChannelMessage("<font face ='" + fontstyle + "'><font size = " + fontsize + "><font color='" + colour + "'><timestamp/> " + auth_symbol[auth] + auth_style[auth] + playname + ": </font>" + this.authEnd(auth_style[auth]) + playmessage, chan, true)
            sys.stopEvent()
        }
    },
    beforeSendMessage: function (msg, channel) {
        if (msg.substr(0, 7) == "~etext ") {
            sys.stopEvent()
            if (msg.substr(7) == "on") {
                etext = "true"
                sys.saveVal('etext', true)
                client.printChannelMessage("+ClientBot: You turned Enriched text on!", channel, false)
                return;
            }
            if (msg.substr(7) == "off") {
                etext = "false"
                sys.saveVal('etext', false)
                client.printChannelMessage("+ClientBot: You turned Enriched text off!", channel, false)
                return;
            }
            client.printChannelMessage("+ClientBot: Please use on/off", channel, false)
        }
        if (msg.substr(0, 11) == "~greentext ") {
            sys.stopEvent()
            if (msg.substr(11) == "on") {
                tgreentext = "true"
                sys.saveVal('tgreentext', true)
                client.printChannelMessage("+ClientBot: You turned greentext on!", channel, false)
                return;
            }
            if (msg.substr(11) == "off") {
                tgreentext = "false"
                sys.saveVal('tgreentext', false)
                client.printChannelMessage("+ClientBot: You turned greentext off!", channel, false)
                return;
            }
            client.printChannelMessage("+ClientBot: Please use on/off", channel, false)
        }
        if (msg.substr(0, 6) == "~eval ") {
            sys.stopEvent()
            var cd = msg.substr(6)
            eval(cd)
        }
    },
})