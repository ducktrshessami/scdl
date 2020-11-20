#!/usr/bin/env node

const scdl = require("scdl-core"); // SoundCloud
const fs = require("fs").promises; // File I/O
var config = require("../cfg/config.json"); // Authorization

var query, ID, OAuth;

/*
Handle args and config updates
*/
function main() {
    for (let i = 2; i < process.argv.length; i++) {
        switch (process.argv[i].toLowerCase()) {
            case "-c": // Set client_id
            case "--client-id":
                if (i == process.argv.length - 1) {
                    throw "client_id not specified";
                }
                else {
                    ID = ID || process.argv[++i];
                }
                break;
            case "-a": // Set OAuth token
            case "--oauth-token":
                if (i == process.argv.length - 1) {
                    throw "OAuth token not specified";
                }
                else {
                    OAuth = OAuth || process.argv[++i];
                }
                break;
            default: // Set download query
                query = query || process.argv[i];
                break;
        }
    }
    if (ID) { // Handle setting authorization like this to get first set if multiple
        config.clientID = ID;
    }
    if (OAuth) {
        config.oauthToken = token;
    }
    if (ID || OAuth) { // Update stored config
        fs.writeFile(`${__dirname}/../cfg/config.json`, JSON.stringify(config, null, 4)).catch(console.error);
    }
    if (query) { // Got query at some point
        downloadSong(query);
    }
    if (!(query || ID || OAuth)) { // Got nothing
        throw "URL not specified";
    }
}

/*
Download song from CLI param

@param URL: a string containing the supposed URL to download
*/
async function downloadSong(query) {
    scdl.setClientID(config.clientID); // Set authorization
    scdl.setOauthToken(config.oauthToken);

    if (!scdl.validateURL(query)) {
        throw "Invalid URL: " + query;
    }
    else {
        scdl.getInfo(query).then(info => { // Get title for filename
            console.log("Downloading " + info.title);
            scdl.downloadFromInfo(info).pipe(fs.createWriteStream(info.title + ".mp3")); // Download to file
        }).catch(console.log);
    }
}

main();
