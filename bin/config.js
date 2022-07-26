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
    return JSON.parse(fs.readFileSync(configFile, { encoding: "utf8" }));
}

function write(data) {
    createIfNotExist(false);
    return fs.promises.writeFile(configFile, JSON.stringify(data, null, 4) + "\n");
}

module.exports = {
    read,
    write
};
