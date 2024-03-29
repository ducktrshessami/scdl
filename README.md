# scdl

A command line interface for [scdl-core](https://github.com/ducktrshessami/scdl-core), a [Node.js](https://nodejs.org/) based SoundCloud downloading module

# Installation

```
npm install -g ducktrshessami/scdl
```

# Usage

```
Usage: scdl [URL] [options]
    URL     The song URL
    options:
        -p,  --playlist          Download a playlist
        -o,  --output            Specify output file
        -c,  --client-id         Set client ID for authorization
        -a,  --oauth-token       Set OAuth token for authorization
        -s,  --strict            Strictly search for a transcoding
        -ps, --preset            Specify a transcoding preset to search for
        -pc, --protocol          Specify a format protocol to search for
        -mt, --mime-type         Specify a format mime type to search for
        -q,  --quality           Specify a transcoding quality to search for

A client ID will automatically be fetched if no valid authorization is present.
More information about transcoding and format option values can be found in
scdl-core: https://github.com/ducktrshessami/scdl-core#stream-options

Default output file is "./artist_name-song_title-song_id.ext"
Default output directory for playlists is "./playlist_title-playlist_id"
```
