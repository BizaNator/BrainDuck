local isUIOpen = false

-- Check if player has database admin permissions
local function hasDBPermission()
    return IsPlayerAceAllowed(PlayerId(), "db.admin")
end

-- Toggle UI visibility
local function toggleUI()
    if not hasDBPermission() then
        TriggerEvent('chat:addMessage', {
            color = {255, 0, 0},
            args = {'System', 'You do not have permission to access the database management UI.'}
        })
        return
    end

    isUIOpen = not isUIOpen
    SetNuiFocus(isUIOpen, isUIOpen)
    SendNUIMessage({
        type = "toggleUI",
        show = isUIOpen
    })
end

-- Register command to open UI
RegisterCommand('dbadmin', function()
    toggleUI()
end, false)

-- NUI Callbacks
RegisterNUICallback('closeUI', function(data, cb)
    isUIOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('executeQuery', function(data, cb)
    if not hasDBPermission() then
        cb({ success = false, error = "Permission denied" })
        return
    end

    TriggerServerEvent('duckdb-handler:executeQuery', data.query)
    cb('ok')
end)

-- Receive query results from server
RegisterNetEvent('duckdb-handler:queryResult')
AddEventHandler('duckdb-handler:queryResult', function(success, result, error)
    SendNUIMessage({
        type = "queryResult",
        success = success,
        result = result,
        error = error
    })
end)

-- Key binding for quick access (Default: F7)
RegisterKeyMapping('dbadmin', 'Open Database Admin UI', 'keyboard', 'F7')
