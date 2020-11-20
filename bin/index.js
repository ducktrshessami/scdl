#!/usr/bin/env node

const scdl = require("scdl-core"); // SoundCloud
const fs = require("fs").promises; // File I/O
var config = require("../cfg/config.json"); // Authorization

var URL, ID, OAuth;

/*
Handle args and config updates
*/
function main() {
    for (let i = 2; i < process.argv.length; i++) {
        switch (process.argv[i].toLowerCase()) {
            case "-c":
            case "--client-id":
                if (i == process.argv.length - 1) {
                    throw "client_id not specified";
                }
                else {
                    ID = ID || process.argv[++i];
                }
                break;
            case "-a":
            case "--oauth-token":
                if (i == process.argv.length - 1) {
                    throw "OAuth token not specified";
                }
                else {
                    OAuth = OAuth || process.argv[++i];
                }
                break;
            default:
                URL = URL || process.argv[i];
                break;
        }
    }
    if (ID) {
        config.clientID = ID;
    }
    if (OAuth) {
        config.oauthToken = token;
    }
    if (ID || OAuth) {
        fs.writeFile("../test.json", JSON.stringify(config, null, 4)).catch(console.error);
    }
    if (URL) {
        downloadSong(URL);
    }
    if (!(URL || ID || OAuth)) {
        throw "URL not specified";
    }
}

/*
*/
async function downloadSong(URL) {
    scdl.setClientID(config.clientID); // Set authorization
    scdl.setOauthToken(config.oauthToken);

    if (!scdl.validateURL(URL)) {
        throw "Invalid URL: " + URL;
    }
    else {
        /*scdl.getInfo(URL).then(info => { // Get title for filename
            console.log("Downloading " + info.title);
            scdl.downloadFromInfo(info).pipe(fs.createWriteStream(info.title + ".mp3")); // Download to file
        }).catch(console.error);*/
        console.log(__dirname + "");
    }
}

main();
