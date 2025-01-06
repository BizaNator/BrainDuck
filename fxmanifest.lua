fx_version 'cerulean'
game 'gta5'

name 'duckdb-handler'
description 'DuckDB handler with MySQL compatibility for FiveM'
author 'Your Name'
version '1.0.0'

server_script {
    'server/index.js',
    'server/compatibility.js'
}

client_scripts {
    'client/client.lua'
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/**/*'
}

dependencies {
    'yarn',
    'webpack'
}

server_only 'yes'
