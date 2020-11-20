# scdl

A command line interface for [scdl-core](https://github.com/ducktrshessami/scdl-core), a Node.js based SoundCloud downloading module

![GitHub top language](https://img.shields.io/github/languages/top/ducktrshessami/scdl)

# Installation

After installing [Node.js](https://nodejs.org/), run the following command:

```
npm install -g github:ducktrshessami/scdl
```

When I become more social I'll consider putting this on [npm](https://www.npmjs.com/). I'd also have to rename this seeing as scdl is [taken](https://www.npmjs.com/package/scdl).

# Usage

```
Usage: scdl [URL] [options]
    URL     The song URL
    options:
        -c, --client-id         Set client ID for authorization
        -a, --oauth-token       Set OAuth token for authorization
        -o, --output            Specify output file

You must set either a client ID or an OAuth token in order to download songs. When either
is set, it is saved to a local config for future use, but may need to be updated as client
IDs expire after a certain amount of time.

Default output file is "./song_title.mp3"
```
