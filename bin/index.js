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
        output,
        preset,
        protocol,
        "mime-type": mimeType,
        quality
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
            let options;
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
            if (preset || protocol || mimeType || quality) {
                options = { preset, protocol, mimeType, quality };
            }
            const info = await getInfoWithRetry(query, playlist);
            return (playlist ? downloadPlaylist : downloadTrack)(info, output, options);
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

function generateName(info, prefix = "", extension = "", outputDir = path.resolve(process.cwd())) {
    let i = 0;
    let filename = (prefix ? prefix + "-" : "") + `${info.title}-${info.id}${extension || ""}`;
    while (fs.existsSync(path.join(outputDir, filename))) {
        i++;
        filename = (prefix ? `${prefix}-` : "") + `${info.title}-${info.id}-${i}${extension || ""}`;
    }
    return filename;
}

function downloadTrack(info, output, options) {
    return new Promise(resolve => {
        const outputPath = path.resolve(output || generateName(info, info.user.username, ".mp3"));
        console.log(`Streaming to ${outputPath}`);
        scdl
            .downloadFromInfo(info, options)
            .on("error", console.error)
            .on("end", () => {
                console.log("Done");
                resolve();
            })
            .pipe(fs.createWriteStream(outputPath));
    });
}

function widen(n, targetWidth) {
    const { length: currentWidth } = n.toString();
    return (new Array(targetWidth - currentWidth))
        .fill(0)
        .join("") + n;
}

async function downloadPlaylist(info, output, options) {
    const outputDir = path.resolve(output || generateName(info));
    if (!fs.existsSync(outputDir)) {
        console.log(`Creating ${outputDir}`);
        fs.mkdirSync(outputDir);
    }
    const streams = await scdl.playlist.downloadFromInfo(info, options);
    const { length: indexWidth } = streams.length.toString();
    return Promise.all(streams.map((stream, i) => new Promise(resolve => {
        const wideIndex = widen(i + 1, indexWidth);
        if (stream) {
            const outputPath = path.join(outputDir, generateName(info.tracks[i], `${wideIndex}-${info.tracks[i].user.username}`, ".mp3", outputDir));
            console.log(`Streaming to ${outputPath}`);
            stream
                .on("error", console.error)
                .on("end", resolve)
                .pipe(fs.createWriteStream(outputPath));
        }
        else {
            console.error(`Failed to stream ${wideIndex}-${info.tracks[i].user.username}-${info.tracks[i].title}-${info.tracks[i].id}`);
        }
    })));
}

main()
    .catch(console.error);
