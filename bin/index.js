#!/usr/bin/env node

const scdl = require("scdl-core"); // SoundCloud
const fs = require("fs"); // File I/O
var config = require("../cfg/config.json"); // Authorization

var query, ID, OAuth, filename;

/*
Handle args and config updates
*/
function main() {
    for (let i = 2; i < process.argv.length; i++) {
        switch (process.argv[i].toLowerCase()) {
            case "-c": // Set client_id
            case "--client-id":
                if (i == process.argv.length - 1) {
                    displayHelp();
                    return;
                }
                else {
                    ID = ID || process.argv[++i];
                }
                break;
            case "-a": // Set OAuth token
            case "--oauth-token":
                if (i == process.argv.length - 1) {
                    displayHelp();
                    return;
                }
                else {
                    OAuth = OAuth || process.argv[++i];
                }
                break;
            case "-o": // Set output file
            case "--output":
                if (i == process.argv.length - 1) {
                    displayHelp();
                    return;
                }
                else {
                    filename = process.argv[++i];
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
        fs.promises.writeFile(`${__dirname}/../cfg/config.json`, JSON.stringify(config, null, 4)).catch(console.error);
    }
    if (query) { // Got query at some point
        downloadSong(query);
    }
    if (!(query || ID || OAuth)) { // Got nothing
        displayHelp();
    }
}

/*
Print usage information to the console
*/
function displayHelp() {
    console.log(`
Usage: scdl [URL] [options]
        URL     The song URL
        options:
            -c, --client-id         Set client ID for authorization
            -a, --oauth-token       Set OAuth token for authorization
            -o, --output            Specify output file
        
You must set either a client ID or an OAuth token in order to download songs. When either
is set, it is saved to a local config for future use, but may need to be updated as client
IDs expire after a certain amount of time.

Default output file is "./song_title.mp3"
`.trim());
}

/*
Download song from CLI param

@param URL: a string containing the supposed URL to download
*/
async function downloadSong(query) {
    scdl.setClientID(config.clientID); // Set authorization
    scdl.setOauthToken(config.oauthToken);

    if (!scdl.validateURL(query)) {
        console.error(`Invalid URL: ${query}`);
    }
    else {
        scdl.getInfo(query).then(info => { // Get title for filename
            console.log(`Downloading ${info.title}.mp3`);
            scdl.downloadFromInfo(info).pipe(fs.createWriteStream(filename ? filename : generateFilename(info.title))); // Download to file
        }).catch(console.error);
    }
}

/*

*/
function generateFilename(title, n = 0) {
    let foo;
    if (n) {
        foo = `${title} (${n}).mp3`;
    }
    else {
        foo = `${title}.mp3`;
    }
    return fs.existsSync(foo) ? generateFilename(title, n + 1) : foo;
}

main();
