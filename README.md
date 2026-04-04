# ob_radio_2

A custom synced vehicle radio system for FiveM with a GTA V-style wheel UI, spatial audio, and per-player sync.

## Features

- **GTA V-style radio wheel** — hold `Q` to open, scroll to select, release to tune in
- **Server-synced playback** — all players on the same station hear the same song at the same position
- **Passenger auto-sync** — when the driver changes station, passengers automatically follow
- **Spatial audio** — radio audio fades, muffles, and cuts based on distance from the vehicle
- **"Body-blocking" effect** — stepping out of the car instantly muffles audio as if the vehicle body is blocking it
- **Custom station logos** — drop `.png` files into `web/img/` and reference them in config
- **Now Playing bar** — minimal text display, only shown while driving, toggleable per-player
- **Emergency vehicle lockout** — automatically disables the radio in police/ambulance/fire vehicles (configurable)
- **Multiple songs per station** with server-driven rotation

## Requirements

- [ox_lib](https://github.com/overextended/ox_lib)

## Installation

1. Drop `ob_radio_2` into your `resources/` folder
2. Add `ensure ob_radio_2` to your `server.cfg`
3. Put your audio files in `songs/` (`.ogg` — real OGG Vorbis or WebM containers both work)
4. Put your station logo images in `web/img/`
5. Edit `config.lua` to define your stations
6. Restart the server (or `ensure ob_radio_2`)

## Configuration

### Stations

```lua
Config.Stations = {
    {
        id = 'OB_RADIO_1',
        label = 'J7 Radio',
        logo = 'j7radio.png',   -- file in web/img/
        songs = {
            { file = 'badhabits.ogg', title = 'Bad Habits', artist = 'KUURO', duration = 187 },
            { file = 'stepaway.ogg',  title = 'Step Away',  artist = 'Chase & Status', duration = 248 },
        },
    },
}
```

Each song's `duration` must match the actual audio length in seconds. Use the bundled tool to auto-detect:

```bash
node tools/song_durations.js
```

It scans `songs/` and prints ready-to-paste Lua entries.

### Other Options

```lua
Config.DefaultVolume = 0.7           -- 0.0 to 1.0
Config.MaxAudioDistance = 30.0       -- audible range when outside vehicle (meters)
Config.MuffleStartDistance = 5.0     -- distance where extra muffling ramps in
Config.SlowMotionWhileOpen = false   -- GTA-style slow-mo when wheel is open
Config.DisableNativeRadio = true     -- disable GTA's built-in radio

-- Disable radio in emergency-class vehicles (class 18: police, ambulance, fire)
Config.DisableInEmergencyClass = true
-- Additional models to block, by display name
Config.DisabledVehicleModels = {}    -- e.g. {'police', 'police2', 'sheriff'}
```

## Controls

| Action | Default |
|---|---|
| Open wheel (hold) | `Q` |
| Select station | Scroll wheel, then release `Q` |
| Turn radio off | Select the OFF slot at the bottom |

The `Q` binding can be rebound in FiveM's in-game Key Bindings menu.

## Commands

| Command | Description |
|---|---|
| `/toggleradioinfo` | Show/hide the "Now Playing" text bar while driving (saved per player) |

## Exports

```lua
-- Get the currently tuned station (table), or nil
exports.ob_radio_2:getCurrentStation()

-- Check if a station is currently playing
exports.ob_radio_2:isRadioPlaying()
```

## File Structure

```
ob_radio_2/
├── fxmanifest.lua
├── config.lua
├── client/
│   ├── main.lua         # vehicle polling, keybinds, NUI callbacks
│   └── spatial.lua      # distance-based volume/filter
├── server/
│   └── main.lua         # station state, song rotation, sync broadcasts
├── web/
│   ├── index.html
│   ├── css/radio.css
│   ├── js/
│   │   ├── audio.js     # Web Audio API playback engine
│   │   ├── radio.js     # wheel UI
│   │   └── nui.js       # NUI message router
│   └── img/             # station logos
├── songs/               # .ogg audio files
└── tools/
    └── song_durations.js  # helper to detect song lengths
```

## How Sync Works

- Server tracks `startedAt` timestamp (millisecond precision) per station
- When a client tunes in, server returns the current elapsed offset
- Clients start playback at that offset using `AudioBufferSourceNode` (seek-accurate)
- When the driver changes stations, the full sync data is broadcast to all clients in one message (no extra round-trips)
- Song rotation happens server-side based on `duration`, broadcasted to all clients

## Credits

Obtaizen
