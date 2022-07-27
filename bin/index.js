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
            return (playlist ? downloadPlaylist : downloadTrack)(query, output);
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

async function downloadTrack(query, output) {
    try {
        const info = await scdl.getInfo(query);
        const outputPath = path.resolve(process.cwd(), output || `${info.user.username} - ${info.title}.mp3`);
    }
    catch (error) {
        if (scdl.oauthToken && error.message === "401 Unauthorized") {
            console.log("Invalid OAuth token\nClearing token and fetching client ID");
            await config.write();
            scdl.oauthToken = null;
            scdl.clientID ||= await fetchKey();
            return downloadTrack(query, output);
        }
        else {
            console.error(error);
        }
    }
}

async function downloadPlaylist(query, output) {

}

main()
    .catch(console.error);
