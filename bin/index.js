#!/usr/bin/env node

const {
    setClientID,
    setOauthToken,
    validatePlaylistURL,
    validateURL,
    getClientID,
    getOauthToken,
    getPlaylistInfo,
    getInfo,
    streamFromInfoSync,
    streamPlaylistFromInfo
} = require("scdl-core");
const { fetchKey } = require("soundcloud-key-fetch");
const { getExtension } = require("mime/lite");
const {
    join: joinPath,
    resolve: resolvePath
} = require("path");
const {
    createWriteStream,
    mkdirSync,
    existsSync,
    createReadStream
} = require("fs");
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
    setClientID(clientID);
    setOauthToken(argsOauthToken);
    if (argsOauthToken) {
        hadAction = true;
        console.log("Storing Oauth token");
        config.write(argsOauthToken);
    }
    if (query) {
        hadAction = true;
        if (playlist ? validatePlaylistURL(query) : validateURL(query)) {
            let options;
            if (!getClientID() && !getOauthToken()) {
                const configOauthToken = config.read();
                if (configOauthToken) {
                    setOauthToken(configOauthToken);
                }
                else {
                    console.log("Fetching client ID");
                    setClientID(await fetchKey());
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
    const usagePath = resolvePath(__dirname, "..", "USAGE");
    createReadStream(usagePath, { encoding: "utf8" })
        .pipe(process.stdout);
}

async function getInfoWithRetry(url, playlist) {
    try {
        return await (playlist ? getPlaylistInfo : getInfo)(url);
    }
    catch (error) {
        if (getOauthToken() && error.message === "401 Unauthorized") {
            console.log("Invalid OAuth token\nClearing token and fetching client ID");
            config.write();
            setOauthToken(null);
            setClientID(getClientID() ?? await fetchKey());
            return getInfoWithRetry(url, playlist);
        }
        else {
            console.error(error);
        }
    }
}

function generateName(infoData, prefix = "", extension = "", outputDir = resolvePath(process.cwd())) {
    let i = 0;
    let filename = (prefix ? prefix + "-" : "") + `${infoData.title}-${infoData.id}${extension || ""}`;
    while (existsSync(joinPath(outputDir, filename))) {
        i++;
        filename = (prefix ? `${prefix}-` : "") + `${infoData.title}-${infoData.id}-${i}${extension || ""}`;
    }
    return filename;
}

function downloadTrack(info, output, options) {
    return new Promise(resolve => {
        const stream = streamFromInfoSync(info, options)
            .on("transcoding", transcoding => {
                const extension = getExtension(transcoding.format.mime_type);
                const outputPath = resolvePath(output || generateName(info.data, info.data.user.username, `.${extension}`));
                console.log(`Streaming to ${outputPath}`);
                stream.pipe(createWriteStream(outputPath));
            })
            .on("error", console.error)
            .on("end", () => {
                console.log("Done");
                resolve();
            });
    });
}

function widen(n, targetWidth) {
    const { length: currentWidth } = n.toString();
    return (new Array(targetWidth - currentWidth))
        .fill(0)
        .join("") + n;
}

async function downloadPlaylist(info, output, options) {
    const outputDir = resolvePath(output || generateName(info.data));
    if (!existsSync(outputDir)) {
        console.log(`Creating ${outputDir}`);
        mkdirSync(outputDir);
    }
    const streams = await streamPlaylistFromInfo(info, options);
    const { length: indexWidth } = streams.length.toString();
    return Promise.all(streams.map((stream, i) => new Promise(resolve => {
        const wideIndex = widen(i + 1, indexWidth);
        if (stream) {
            const extension = getExtension(stream.transcoding.format.mime_type);
            const outputPath = joinPath(outputDir, generateName(info.data.tracks[i], `${wideIndex}-${info.data.tracks[i].user.username}`, `.${extension}`, outputDir));
            console.log(`Streaming to ${outputPath}`);
            stream
                .on("error", console.error)
                .on("end", resolve)
                .pipe(createWriteStream(outputPath));
        }
        else {
            console.error(`Failed to stream ${wideIndex}-${info.data.tracks[i].user.username}-${info.data.tracks[i].title}-${info.data.tracks[i].id}`);
        }
    })));
}

main()
    .catch(console.error);
