-- Global FiveM natives and functions that should be recognized
globals = {
    "source",
    "GetCurrentResourceName",
    "RegisterCommand",
    "RegisterNetEvent",
    "AddEventHandler",
    "TriggerEvent",
    "TriggerClientEvent",
    "TriggerServerEvent",
    "IsPlayerAceAllowed",
    "PlayerId",
    "SetNuiFocus",
    "SendNUIMessage",
    "RegisterNUICallback",
    "RegisterKeyMapping",
    "IsPauseMenuActive",
    "IsPlayerDead",
    "GetResourceMetadata"
}

-- Ignore unused self parameters in methods
self = false

-- Maximum line length
max_line_length = 120

-- Ignore specific warnings
ignore = {
    "212", -- Unused argument
    "213", -- Unused loop variable
    "421", -- Shadowing definition of variable
    "431", -- Shadowing upvalue
    "432", -- Shadowing upvalue argument
    "611", -- Line contains only whitespace
    "612", -- Line contains trailing whitespace
    "614"  -- Trailing empty line
}

-- Files to exclude from checking
exclude_files = {
    "node_modules/",
    "dist/",
    "web/"
}

-- Allow mixed case identifiers (common in FiveM)
allow_defined = true
allow_defined_top = true

-- Assume these std libraries are available
std = "lua51+fivem"

-- Files patterns to check
include_files = {
    "client/**/*.lua",
    "server/**/*.lua"
}

-- Custom file patterns
files["client/**/*.lua"] = {
    std = "lua51+fivem+client"
}

files["server/**/*.lua"] = {
    std = "lua51+fivem+server"
}

-- Misc options
cache = true
jobs = 4
color = true
codes = true
formatter = "plain"
