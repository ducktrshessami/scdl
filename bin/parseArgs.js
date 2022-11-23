const {
    Preset,
    Protocol,
    MimeType,
    Quality
} = require("scdl-core");

const flags = {
    playlist: {
        short: "p",
        requireValue: false
    },
    output: {
        short: "o",
        requireValue: true
    },
    "client-id": {
        short: "c",
        requireValue: true
    },
    "oauth-token": {
        short: "a",
        requireValue: true
    },
    preset: {
        short: "ps",
        requireValue: true,
        enum: Preset
    },
    protocol: {
        short: "pc",
        requireValue: true,
        enum: Protocol
    },
    "mime-type": {
        short: "mt",
        requireValue: true,
        enum: MimeType
    },
    quality: {
        short: "q",
        requireValue: true,
        enum: Quality
    }
};

function getFlag(str) {
    if (str) {
        const name = str
            .match(/^(?:--?)([\w-]+)$/)
            ?.at(1);
        return Object
            .keys(flags)
            .find(flag => flag === name || (flags[flag].short && flags[flag].short === name));
    }
}

function parseArgs() {
    const result = {};
    Object
        .keys(flags)
        .forEach(flag => {
            if (!flags[flag].requireValue) {
                result[flag] = false;
            }
        });
    for (let i = 2; i < process.argv.length; i++) {
        const flag = getFlag(process.argv[i]);
        if (flag) {
            if (flags[flag].requireValue) {
                if (!process.argv[i + 1] || getFlag(process.argv[i + 1])) {
                    throw new Error(`Option ${process.argv[i]} requires a value`);
                }
                else {
                    const value = process.argv[++i];
                    if (flags[flag].enum) {
                        const caps = value.toUpperCase();
                        if (caps in flags[flag].enum) {
                            result[flag] = flags[flag].enum[caps];
                            continue;
                        }
                    }
                    result[flag] = value;
                }
            }
            else {
                result[flag] = true;
            }
        }
        else if (!result.query) {
            result.query = process.argv[i];
        }
    }
    return result;
}

module.exports = parseArgs;
