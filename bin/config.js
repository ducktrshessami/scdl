import { join, resolve } from "path";
import {
    existsSync,
    mkdirSync,
    writeFileSync,
    readFileSync
} from "fs";

const configDir = resolve(__dirname, "..", "config");
const configFile = join(configDir, "config.json");
const configDefault = "{\n    \"oauthToken\": \"\"\n}\n";

function createIfNotExist(checkFile) {
    if (!existsSync(configDir)) {
        mkdirSync(configDir);
    }
    if (checkFile && !existsSync(configFile)) {
        writeFileSync(configFile, configDefault);
    }
}

export function read() {
    createIfNotExist(true);
    const { oauthToken } = JSON.parse(readFileSync(configFile, { encoding: "utf8" }));
    return oauthToken || null;
}

export function write(oauthToken = "") {
    createIfNotExist(false);
    writeFileSync(configFile, `{\n    "oauthToken": "${oauthToken}"\n}\n`);
}
