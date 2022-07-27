#!/usr/bin/env node

const scdl = require("scdl-core");
const { fetchKey } = require("soundcloud-key-fetch");
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
    scdl.clientID = clientID;
    scdl.oauthToken = argsOauthToken;
    if (argsOauthToken) {
        console.log("Storing Oauth token");
        config.write(argsOauthToken);
    }
    if (playlist ? scdl.playlist.validateURL(query) : scdl.validateURL(query)) {
        if (!scdl.clientID && !scdl.oauthToken) {
            const { oauthToken: configOauthToken } = config.read();
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
        throw new Error("Invalid URL");
    }
}

async function downloadPlaylist(query, output) {

}

async function downloadTrack(query, output) {

}

main()
    .catch(console.error);
