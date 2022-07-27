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
        config.write(argsOauthToken);
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

}

async function downloadPlaylist(query, output) {

}

main()
    .catch(console.error);
