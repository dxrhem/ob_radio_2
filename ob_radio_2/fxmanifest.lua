fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'ob_radio_2'
description 'Custom synced radio system with GTA V-style wheel UI'
author 'Obtaizen'
version '1.0.0'

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua',
}

client_scripts {
    'client/main.lua',
    'client/environment.lua',
    'client/spatial.lua',
}

server_scripts {
    'server/main.lua',
}

ui_page 'web/index.html'

files {
    'web/index.html',
    'web/css/*.css',
    'web/js/*.js',
    'web/img/*',

    -- Root-level .ogg tracks
    'songs/*.ogg',
    'songs/*.mp3',

    -- Per-playlist folders — listed explicitly because this FiveM build
    -- doesn't honour `songs/**/*.mp3` recursive globs for NUI assets.
    'songs/billieeilish/*.mp3',
    'songs/davemix/*.mp3',
    'songs/dnbmix/*.mp3',
    'songs/nostalgiamix/*.mp3',
    'songs/oldschoolmix/*.mp3',
    'songs/sleeptoken/*.mp3',
    'songs/spanishradio/*.mp3',
}

dependencies {
    'ox_lib',
}
