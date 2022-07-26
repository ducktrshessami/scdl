const flags = {
    p: {
        long: "playlist",
        requireValue: false
    },
    o: {
        long: "output",
        requireValue: true
    },
    c: {
        long: "client-id",
        requireValue: true
    },
    a: {
        long: "oauth-token",
        requireValue: true
    }
};

function parseArgs() {

}

module.exports = parseArgs;
