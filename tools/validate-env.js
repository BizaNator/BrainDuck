const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function checkCommand(command, errorMessage) {
    try {
        execSync(command, { stdio: 'pipe' });
        return true;
    } catch (error) {
        console.error(`Error: ${errorMessage}`);
        console.error(`Details: ${error.message}`);
        return false;
    }
}

function checkFile(filePath, description) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: Missing ${description} at ${filePath}`);
        return false;
    }
    return true;
}

function validateEnvironment() {
    console.log('Validating development environment...');
    let isValid = true;

    // Check Lua installation
    if (!checkCommand('luac -v', 'Lua compiler (luac) not found. Please install Lua.')) {
        isValid = false;
    }

    // Check luacheck installation
    if (!checkCommand('luacheck --version', 'luacheck not found. Please install luacheck.')) {
        isValid = false;
    }

    // Check required config files
    const requiredFiles = [
        { path: '.luacheckrc', desc: 'Luacheck configuration' },
        { path: '.lua-format.yaml', desc: 'Lua formatter configuration' },
        { path: '.luarc.json', desc: 'Lua language server configuration' }
    ];

    for (const file of requiredFiles) {
        if (!checkFile(path.join(process.cwd(), file.path), file.desc)) {
            isValid = false;
        }
    }

    // Check FiveM Lua files
    const luaFiles = ['client/client.lua', 'fxmanifest.lua'];
    for (const file of luaFiles) {
        if (!checkFile(path.join(process.cwd(), file), `FiveM Lua file (${file})`)) {
            isValid = false;
        }
    }

    // Validate Lua syntax
    console.log('\nValidating Lua syntax...');
    try {
        execSync('npm run verify:lua', { stdio: 'inherit' });
    } catch (error) {
        console.error('Error: Lua syntax validation failed');
        isValid = false;
    }

    // Check VS Code extensions (if in VS Code environment)
    if (process.env.VSCODE_CLI) {
        console.log('\nChecking VS Code extensions...');
        const requiredExtensions = [
            'sumneko.lua',
            'trixnz.vscode-lua',
            'actboy168.lua-format'
        ];

        for (const ext of requiredExtensions) {
            try {
                execSync(`code --list-extensions | grep -i ${ext}`, { stdio: 'pipe' });
                console.log(`✓ Found extension: ${ext}`);
            } catch (error) {
                console.warn(`⚠ Missing recommended extension: ${ext}`);
            }
        }
    }

    if (isValid) {
        console.log('\n✓ Environment validation passed!');
        return true;
    } else {
        console.error('\n✗ Environment validation failed!');
        console.error('Please fix the above issues before continuing.');
        return false;
    }
}

// Run validation if called directly
if (require.main === module) {
    const isValid = validateEnvironment();
    process.exit(isValid ? 0 : 1);
}

module.exports = validateEnvironment;
