import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync
} from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const configDir = fileURLToPath(new URL("../config", import.meta.url));;
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

export function readConfig() {
    createIfNotExist(true);
    const { oauthToken } = JSON.parse(readFileSync(configFile, { encoding: "utf8" }));
    return oauthToken || null;
}

export function writeConfig(oauthToken = "") {
    createIfNotExist(false);
    writeFileSync(configFile, `{\n    "oauthToken": "${oauthToken}"\n}\n`);
}
