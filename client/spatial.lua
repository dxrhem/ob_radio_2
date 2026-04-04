-- ob_radio_2 Client - Spatial audio module
-- Fades + muffles radio audio based on distance from the vehicle playing it.

local nearbyVehicles = {} -- [netId] = stationIndex (from broadcasts)
lastRadioVehicle = nil    -- resource-global, also updated from main.lua when entering a vehicle

AddEventHandler('ob_radio_2:nearbyVehicleUpdate', function(netId, stationIndex)
    nearbyVehicles[netId] = stationIndex
end)

local function findNearestRadioVehicle(playerCoords)
    local closestDist = Config.MaxAudioDistance + 1
    local closestVeh = nil

    -- First, try the player's last-known vehicle (works even if broadcast was missed)
    if lastRadioVehicle and DoesEntityExist(lastRadioVehicle) then
        local dist = #(playerCoords - GetEntityCoords(lastRadioVehicle))
        if dist < Config.MaxAudioDistance then
            closestDist = dist
            closestVeh = lastRadioVehicle
        end
    end

    -- Then scan nearby vehicles from broadcast list
    for _, vehicle in ipairs(GetGamePool('CVehicle')) do
        if DoesEntityExist(vehicle) and vehicle ~= lastRadioVehicle and NetworkGetEntityIsNetworked(vehicle) then
            local netId = NetworkGetNetworkIdFromEntity(vehicle)
            if nearbyVehicles[netId] then
                local dist = #(playerCoords - GetEntityCoords(vehicle))
                if dist < closestDist then
                    closestDist = dist
                    closestVeh = vehicle
                end
            end
        end
    end

    return closestVeh, closestDist
end

CreateThread(function()
    while true do
        if isInVehicle and currentStation then
            -- Inside vehicle — full volume, no filter
            SendNUIMessage({
                action = 'updateSpatial',
                spatial = { volume = playerVolume, filterFreq = 22000 },
            })
            Wait(500)
        elseif currentStation then
            -- Outside vehicle but radio still playing
            local playerCoords = GetEntityCoords(PlayerPedId())
            local _, dist = findNearestRadioVehicle(playerCoords)

            -- Base "vehicle body blocking" effect — always muffled when outside
            local bodyBlockVolume = 0.55
            local bodyBlockFilter = 1800

            -- Clamp distance to MaxAudioDistance for calculation (so it saturates at silent)
            local clampedDist = math.min(dist, Config.MaxAudioDistance)
            local distRatio = clampedDist / Config.MaxAudioDistance
            local volume = bodyBlockVolume * (1.0 - distRatio) * playerVolume
            local filterFreq = bodyBlockFilter - (distRatio * (bodyBlockFilter - 300))

            SendNUIMessage({
                action = 'updateSpatial',
                spatial = { volume = volume, filterFreq = filterFreq },
            })
            Wait(150)
        else
            Wait(500)
        end
    end
end)
