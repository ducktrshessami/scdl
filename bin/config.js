const path = require("path");
const fs = require("fs");

const configDir = path.resolve(__dirname, "..", "config");
const configFile = path.join(configDir, "config.json");
const configDefault = "{\n    \"oauthToken\": \"\"\n}\n";

function createIfNotExist(checkFile) {
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }
    if (checkFile && !fs.existsSync(configFile)) {
        fs.writeFileSync(configFile, configDefault);
    }
}

function read() {
    createIfNotExist(true);
    const { oauthToken } = JSON.parse(fs.readFileSync(configFile, { encoding: "utf8" }));
    return oauthToken || null;
}

function write(oauthToken = "") {
    createIfNotExist(false);
    return fs.promises.writeFile(configFile, `{\n    "oauthToken": "${oauthToken}"\n}\n`);
}

module.exports = {
    read,
    write
};
