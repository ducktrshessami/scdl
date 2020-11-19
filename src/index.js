const scdl = require("scdl"); // SoundCloud
const fs = require("fs"); // File I/O

scdl.setClientID(""); // Set client_id

const URL = process.argv[2]; // Get arg
if (!URL) {
    throw "URL not specified";
}
if (!scdl.validateURL(URL)) {
    throw "Invalid URL: " + URL;
}

scdl.getInfo(URL).then(info => { // Get title for filename
    console.log("Downloading " + info.title);
    scdl.downloadFromInfo(info).pipe(fs.createWriteStream(info.title + ".mp3")); // Download to file
}).catch(console.log);
