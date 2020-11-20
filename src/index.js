const scdl = require("scdl-core"); // SoundCloud
const fs = require("fs").promises; // File I/O

var URL, clientID, OAuth;

/*
Handle args
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
                    clientID = clientID || process.argv[++i];
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
    if (clientID) {
        newClientID(clientID);
    }
    if (OAuth) {
        newOauthToken(OAuth);
    }
    if (clientID || OAuth) {
        updateConfig();
    }
    if (URL) {
        downloadSong(URL);
    }
    if (!(URL || clientID || OAuth)) {
        throw "URL not specified";
    }
}

/*
*/
async function downloadSong(URL) {
    if (!scdl.validateURL(URL)) {
        throw "Invalid URL: " + URL;
    }
    else {
        scdl.getInfo(URL).then(info => { // Get title for filename
            console.log("Downloading " + info.title);
            scdl.downloadFromInfo(info).pipe(fs.createWriteStream(info.title + ".mp3")); // Download to file
        }).catch(console.error);
    }
}

/*
*/
function newClientID(ID) {
    scdl.setClientID(ID);
}

/*
*/
function newOauthToken(token) {
    scdl.setOauthToken(token);
}

/*
*/
function updateConfig() {
    
}

main();
