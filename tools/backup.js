const duckdb = require('duckdb');
const path = require('path');
const fs = require('fs').promises;

async function loadConfig() {
    try {
        const configPath = path.join(process.cwd(), 'migration-config.json');
        return require(configPath);
    } catch (error) {
        return {
            options: {
                backupPath: './backups'
            }
        };
    }
}

async function createBackup(config = null) {
    if (!config) {
        config = await loadConfig();
    }

    const backupDir = config.options?.backupPath || './backups';
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.duckdb`);
    
    console.log(`Creating backup at: ${backupPath}`);

    const db = new duckdb.Database(path.join(process.cwd(), '..', 'database.duckdb'));

    try {
        // Get database stats before backup
        const stats = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    COUNT(*) as table_count 
                FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `, (err, result) => {
                if (err) reject(err);
                else resolve(result[0]);
            });
        });

        // Create the backup
        await new Promise((resolve, reject) => {
            db.all(`EXPORT DATABASE '${backupPath}'`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Verify backup file exists and get its size
        const backupStats = await fs.stat(backupPath);
        
        console.log('\nBackup Summary:');
        console.log('----------------');
        console.log(`Location: ${backupPath}`);
        console.log(`Size: ${formatBytes(backupStats.size)}`);
        console.log(`Tables: ${stats.table_count}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('\nBackup completed successfully!');

        return {
            path: backupPath,
            size: backupStats.size,
            timestamp: new Date().toISOString(),
            tables: stats.table_count
        };

    } catch (error) {
        console.error('Backup failed:', error.message);
        throw error;
    } finally {
        db.close();
    }
}

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i];
}

async function listBackups() {
    const config = await loadConfig();
    const backupDir = config.options?.backupPath || './backups';

    try {
        await fs.mkdir(backupDir, { recursive: true });
        const files = await fs.readdir(backupDir);
        const backups = [];

        for (const file of files) {
            if (file.endsWith('.duckdb')) {
                const stats = await fs.stat(path.join(backupDir, file));
                backups.push({
                    filename: file,
                    size: formatBytes(stats.size),
                    created: stats.mtime
                });
            }
        }

        console.log('\nAvailable Backups:');
        console.log('------------------');
        backups.sort((a, b) => b.created - a.created);
        
        backups.forEach(backup => {
            console.log(`\nFilename: ${backup.filename}`);
            console.log(`Size: ${backup.size}`);
            console.log(`Created: ${backup.created.toISOString()}`);
        });

        return backups;
    } catch (error) {
        console.error('Error listing backups:', error.message);
        throw error;
    }
}

if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'list') {
        listBackups()
            .catch(error => {
                console.error('Failed to list backups:', error);
                process.exit(1);
            });
    } else {
        createBackup()
            .catch(error => {
                console.error('Failed to create backup:', error);
                process.exit(1);
            });
    }
}

module.exports = {
    createBackup,
    listBackups
};
