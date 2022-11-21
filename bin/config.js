const { join, resolve } = require("path");
const {
    existsSync,
    mkdirSync,
    writeFileSync,
    readFileSync
} = require("fs");

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

function read() {
    createIfNotExist(true);
    const { oauthToken } = JSON.parse(readFileSync(configFile, { encoding: "utf8" }));
    return oauthToken || null;
}

function write(oauthToken = "") {
    createIfNotExist(false);
    writeFileSync(configFile, `{\n    "oauthToken": "${oauthToken}"\n}\n`);
}

module.exports = {
    read,
    write
};
