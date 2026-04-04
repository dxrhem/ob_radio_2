-- Server-side radio sync system
-- Tracks what each station is currently playing and when it started

local stationStates = {}
local vehicleStations = {} -- [netId] = stationIndex

-- Initialize all station states
for i, station in ipairs(Config.Stations) do
    stationStates[i] = {
        songIndex = 1,
        startedAt = GetGameTimer(),
    }
end

-- Advance to next song in a station
local function advanceSong(stationIndex)
    local station = Config.Stations[stationIndex]
    if not station then return end
    local state = stationStates[stationIndex]

    state.songIndex = state.songIndex + 1
    if state.songIndex > #station.songs then
        state.songIndex = 1
    end
    state.startedAt = GetGameTimer()

    -- Broadcast to all clients
    TriggerClientEvent('ob_radio_2:songChanged', -1, stationIndex, state.songIndex, station.songs[state.songIndex])
end

local function elapsedSeconds(startedAt)
    return (GetGameTimer() - startedAt) / 1000.0
end

-- Song rotation thread
CreateThread(function()
    while true do
        for i, state in pairs(stationStates) do
            local station = Config.Stations[i]
            if station and station.songs[state.songIndex] then
                if elapsedSeconds(state.startedAt) >= station.songs[state.songIndex].duration then
                    advanceSong(i)
                end
            end
        end
        Wait(500)
    end
end)

-- Client requests to tune into a station
lib.callback.register('ob_radio_2:tuneIn', function(source, stationIndex, vehicleNetId)
    local station = Config.Stations[stationIndex]
    if not station then return nil end

    local state = stationStates[stationIndex]
    local song = station.songs[state.songIndex]
    local elapsed = elapsedSeconds(state.startedAt)

    local syncData = {
        songIndex = state.songIndex,
        song = song,
        offset = elapsed,
        stationIndex = stationIndex,
    }

    -- Track which vehicle is playing which station; broadcast full sync data
    if vehicleNetId then
        vehicleStations[vehicleNetId] = stationIndex
        TriggerClientEvent('ob_radio_2:vehicleStationUpdate', -1, vehicleNetId, stationIndex, syncData)
    end

    return syncData
end)

-- Client turns off radio
lib.callback.register('ob_radio_2:tuneOff', function(source, vehicleNetId)
    if vehicleNetId then
        vehicleStations[vehicleNetId] = nil
        TriggerClientEvent('ob_radio_2:vehicleStationUpdate', -1, vehicleNetId, nil)
    end
    return true
end)

-- Get what station a vehicle is playing
lib.callback.register('ob_radio_2:getVehicleStation', function(source, vehicleNetId)
    local stationIndex = vehicleStations[vehicleNetId]
    if not stationIndex then return nil end

    local station = Config.Stations[stationIndex]
    local state = stationStates[stationIndex]
    local song = station.songs[state.songIndex]
    local elapsed = elapsedSeconds(state.startedAt)

    return {
        stationIndex = stationIndex,
        songIndex = state.songIndex,
        song = song,
        offset = elapsed,
    }
end)

-- Clean up when vehicle is deleted
AddEventHandler('entityRemoved', function(entity)
    local netId = NetworkGetNetworkIdFromEntity(entity)
    if vehicleStations[netId] then
        vehicleStations[netId] = nil
    end
end)
