#!/usr/bin/env node

import { fetchClientID } from "@scdl/fetch-client";
import {
    createReadStream,
    createWriteStream,
    existsSync,
    mkdirSync
} from "fs";
import mime from "mime/lite.js";
import {
    join,
    resolve as resolvePath
} from "path";
import sanitize from "sanitize-filename";
import {
    getClientID,
    getInfo,
    getOauthToken,
    getPlaylistInfo,
    setClientID,
    setOauthToken,
    streamFromInfoSync,
    streamPlaylistFromInfo,
    validatePlaylistURL,
    validateURL
} from "scdl-core";
import { fileURLToPath } from "url";
import { readConfig, writeConfig } from "./config.js";
import parseArgs from "./parseArgs.js";

const REPLACEMENT_CHAR = "-";

try {
    const {
        query,
        playlist,
        "client-id": clientID,
        "oauth-token": argsOauthToken,
        output,
        strict,
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
        writeConfig(argsOauthToken);
    }
    if (query) {
        hadAction = true;
        if (playlist ? validatePlaylistURL(query) : validateURL(query)) {
            let options;
            if (!getClientID() && !getOauthToken()) {
                const configOauthToken = readConfig();
                if (configOauthToken) {
                    setOauthToken(configOauthToken);
                }
                else {
                    console.log("Fetching client ID");
                    setClientID(await fetchClientID());
                }
            }
            if (preset || protocol || mimeType || quality) {
                options = { strict, preset, protocol, mimeType, quality };
            }
            else if (strict) {
                console.warn("No transcoding/format options found\nIgnoring strict flag");
            }
            const info = await getInfoWithRetry(query, playlist);
            await (playlist ? downloadPlaylist : downloadTrack)(info, output, options);
        }
        else {
            throw new Error(`Invalid URL: ${query}`);
        }
    }
    if (!hadAction) {
        displayHelp();
    }
}
catch (err) {
    console.error(err);
}

function displayHelp() {
    const usagePath = fileURLToPath(new URL("../USAGE", import.meta.url));
    createReadStream(usagePath, { encoding: "utf8" })
        .pipe(process.stdout);
}

async function getInfoWithRetry(url, playlist) {
    try {
        return await (playlist ? getPlaylistInfo : getInfo)(url);
    }
    catch (err) {
        if (getOauthToken() && err.message === "401 Unauthorized") {
            console.log("Invalid OAuth token\nClearing token and fetching client ID");
            writeConfig();
            setOauthToken(null);
            setClientID(getClientID() ?? await fetchClientID());
            return getInfoWithRetry(url, playlist);
        }
        else {
            console.error(err);
        }
    }
}

function generateName(infoData, prefix = "", extension = "", outputDir = process.cwd()) {
    const sanitizedTitle = sanitize(infoData.title, { replacement: REPLACEMENT_CHAR });
    const sanitizedPrefix = (prefix ? sanitize(prefix + "-", { replacement: REPLACEMENT_CHAR }) : "");
    let i = 0;
    let filename = sanitizedPrefix + `${sanitizedTitle}-${infoData.id}${extension || ""}`;
    while (existsSync(join(outputDir, filename))) {
        i++;
        filename = sanitizedPrefix + `${sanitizedTitle}-${infoData.id}-${i}${extension || ""}`;
    }
    return filename;
}

function downloadTrack(info, output, options) {
    return new Promise(resolve => {
        const stream = streamFromInfoSync(info, options)
            .on("transcoding", transcoding => {
                const extension = mime.getExtension(transcoding.format.mime_type);
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
            const extension = mime.getExtension(stream.transcoding.format.mime_type);
            const outputPath = join(outputDir, generateName(info.data.tracks[i], `${wideIndex}-${info.data.tracks[i].user.username}`, `.${extension}`, outputDir));
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
