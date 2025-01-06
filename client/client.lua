local isUIOpen = false
local resourceName = GetCurrentResourceName()

-- Check if player has database admin permissions
local function hasDBPermission()
    if not IsDuplicityVersion() then -- Ensure we're on the client side
        local playerId = PlayerId()
        if not playerId then return false end
        return IsPlayerAceAllowed(playerId, "db.admin")
    end
    return false
end

-- Notification helper
local function notify(type, message)
    if type == 'error' then
        TriggerEvent('chat:addMessage', {
            color = {255, 0, 0},
            args = {'Database', message}
        })
    else
        TriggerEvent('chat:addMessage', {
            color = {0, 255, 0},
            args = {'Database', message}
        })
    end
end

-- Toggle UI visibility
local function toggleUI()
    if not hasDBPermission() then
        notify('error', 'You do not have permission to access the database management UI.')
        return
    end

    -- Ensure we're not in a cutscene or similar
    if IsPauseMenuActive() or IsPlayerDead(PlayerId()) then
        notify('error', 'Cannot open database UI in this state.')
        return
    end

    isUIOpen = not isUIOpen
    SetNuiFocus(isUIOpen, isUIOpen)
    SetNuiFocusKeepInput(false) -- Disable game input while UI is open
    
    SendNUIMessage({
        type = "toggleUI",
        show = isUIOpen,
        version = GetResourceMetadata(resourceName, 'version', 0)
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
