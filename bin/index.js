#!/usr/bin/env node

const scdl = require("scdl-core");
const { fetchKey } = require("soundcloud-key-fetch");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const parseArgs = require("./parseArgs");

async function main() {
    const {
        query,
        playlist,
        "client-id": clientID,
        "oauth-token": argsOauthToken,
        output
    } = parseArgs();
    let hadAction = false;
    scdl.clientID = clientID;
    scdl.oauthToken = argsOauthToken;
    if (argsOauthToken) {
        hadAction = true;
        console.log("Storing Oauth token");
        await config.write(argsOauthToken);
    }
    if (query) {
        hadAction = true;
        if (playlist ? scdl.playlist.validateURL(query) : scdl.validateURL(query)) {
            if (!scdl.clientID && !scdl.oauthToken) {
                const configOauthToken = config.read();
                if (configOauthToken) {
                    scdl.oauthToken = configOauthToken;
                }
                else {
                    console.log("Fetching client ID");
                    scdl.clientID = await fetchKey();
                }
            }
            const info = await getInfoWithRetry(query, playlist);
            return (playlist ? downloadPlaylist : downloadTrack)(info, output);
        }
        else {
            throw new Error(`Invalid URL: ${query}`);
        }
    }
    if (!hadAction) {
        displayHelp();
    }
}

function displayHelp() {
    const usagePath = path.resolve(__dirname, "..", "USAGE");
    fs
        .createReadStream(usagePath, { encoding: "utf8" })
        .pipe(process.stdout);
}

async function getInfoWithRetry(url, playlist) {
    try {
        return await (playlist ? scdl.playlist.getInfo : scdl.getInfo)(url);
    }
    catch (error) {
        if (scdl.oauthToken && error.message === "401 Unauthorized") {
            console.log("Invalid OAuth token\nClearing token and fetching client ID");
            await config.write();
            scdl.oauthToken = null;
            scdl.clientID ||= await fetchKey();
            return getInfoWithRetry(url, playlist);
        }
        else {
            console.error(error);
        }
    }
}

function generateFilename(info, outputDir = path.resolve(process.cwd())) {
    let i = 0;
    let filename = `${info.user.username}-${info.title}-${info.id}.mp3`;
    while (fs.existsSync(path.join(outputDir, filename))) {
        filename = `${info.user.username}-${info.title}-${info.id}-${++i}.mp3`;
    }
    return filename;
}

function downloadTrack(info, output) {
    return new Promise(resolve => {
        const outputPath = path.resolve(output || generateFilename(info));
        console.log(`Streaming to ${outputPath}`);
        scdl
            .downloadFromInfo(info)
            .on("error", console.error)
            .on("end", () => {
                console.log("Done");
                resolve();
            })
            .pipe(fs.createWriteStream(outputPath));
    });
}

async function downloadPlaylist(info, output) {

}

main()
    .catch(console.error);
