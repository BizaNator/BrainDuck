const duckdb = require('duckdb');
const path = require('path');
const fs = require('fs').promises;

// Load configuration
async function loadConfig() {
    try {
        const configPath = path.join(process.cwd(), 'migration-config.json');
        const configExists = await fs.access(configPath)
            .then(() => true)
            .catch(() => false);
        
        return configExists ? require(configPath) : {};
    } catch (error) {
        console.error('Error loading config:', error.message);
        return {};
    }
}

// Setup DuckDB connection
function connectToDB() {
    const dbPath = path.join(process.cwd(), '..', 'database.duckdb');
    return new duckdb.Database(dbPath);
}

// Verify table structure
async function verifyTableStructure(db, tableName) {
    return new Promise((resolve, reject) => {
        db.all(`DESCRIBE ${tableName}`, (err, columns) => {
            if (err) reject(err);
            else resolve(columns);
        });
    });
}

// Verify data integrity
async function verifyDataIntegrity(db, tableName) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                COUNT(*) as total_rows,
                COUNT(DISTINCT *) as unique_rows,
                SUM(CASE WHEN id IS NULL THEN 1 ELSE 0 END) as null_ids
            FROM ${tableName}
        `, (err, result) => {
            if (err) reject(err);
            else resolve(result[0]);
        });
    });
}

// Check for schema version and migrations
async function verifySchemaVersion(db) {
    try {
        const [result] = await new Promise((resolve, reject) => {
            db.all(`
                SELECT version, name, applied_at 
                FROM schema_migrations 
                ORDER BY id DESC 
                LIMIT 1
            `, (err, result) => {
                if (err && err.message.includes('no such table')) {
                    resolve([{ version: '0', name: 'none', applied_at: null }]);
                } else if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        return result;
    } catch (error) {
        console.warn('Error checking schema version:', error.message);
        return { version: 'unknown', name: 'error', applied_at: null };
    }
}

// Check permissions system
async function verifyPermissions(db) {
    try {
        const results = {
            permissions: 0,
            groupPermissions: 0,
            userPermissions: 0,
            adminCount: 0
        };

        // Count permissions
        const [permsCount] = await new Promise((resolve, reject) => {
            db.all('SELECT COUNT(*) as count FROM permissions', (err, result) => {
                if (err && err.message.includes('no such table')) {
                    resolve([{ count: 0 }]);
                } else if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        results.permissions = permsCount.count;

        // Count group permissions
        const [groupPermsCount] = await new Promise((resolve, reject) => {
            db.all('SELECT COUNT(*) as count FROM group_permissions', (err, result) => {
                if (err && err.message.includes('no such table')) {
                    resolve([{ count: 0 }]);
                } else if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        results.groupPermissions = groupPermsCount.count;

        // Count user permissions
        const [userPermsCount] = await new Promise((resolve, reject) => {
            db.all('SELECT COUNT(*) as count FROM user_permissions', (err, result) => {
                if (err && err.message.includes('no such table')) {
                    resolve([{ count: 0 }]);
                } else if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        results.userPermissions = userPermsCount.count;

        // Count admin users
        const [adminCount] = await new Promise((resolve, reject) => {
            db.all(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE group = 'admin'
            `, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        results.adminCount = adminCount.count;

        return results;
    } catch (error) {
        console.warn('Error checking permissions:', error.message);
        return null;
    }
}

// Check for common FiveM data patterns
async function verifyFiveMData(db, tableName) {
    const commonColumns = ['identifier', 'license', 'steam', 'discord', 'fivem'];
    const results = {};

    for (const column of commonColumns) {
        try {
            const [result] = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT COUNT(DISTINCT ${column}) as unique_count
                    FROM ${tableName}
                    WHERE ${column} IS NOT NULL
                `, (err, result) => {
                    if (err && err.message.includes('no such column')) {
                        resolve([{ unique_count: null }]);
                    } else if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            results[column] = result.unique_count;
        } catch (error) {
            console.warn(`Error checking ${column} in ${tableName}:`, error.message);
        }
    }

    return results;
}

async function verify() {
    console.log('Starting post-migration verification...');
    const db = connectToDB();
    
    try {
        // Get all tables
        const tables = await new Promise((resolve, reject) => {
            db.all(`
                SELECT name 
                FROM sqlite_master 
                WHERE type='table' 
                AND name NOT LIKE 'sqlite_%'
            `, (err, tables) => {
                if (err) reject(err);
                else resolve(tables);
            });
        });

        console.log(`Found ${tables.length} tables to verify\n`);
        const results = [];

        for (const table of tables) {
            const tableName = table.name;
            console.log(`Verifying table: ${tableName}`);

            // Collect verification data
            const structure = await verifyTableStructure(db, tableName);
            const integrity = await verifyDataIntegrity(db, tableName);
            const fivemData = await verifyFiveMData(db, tableName);

            results.push({
                table: tableName,
                columns: structure.length,
                rowCount: integrity.total_rows,
                uniqueRows: integrity.unique_rows,
                nullIds: integrity.null_ids,
                fivemIdentifiers: fivemData
            });

            // Output results for this table
            console.log('  Structure:', `${structure.length} columns`);
            console.log('  Data:', {
                total: integrity.total_rows,
                unique: integrity.unique_rows,
                nullIds: integrity.null_ids
            });
            console.log('  FiveM identifiers:', fivemData);
            console.log('');
        }

        // Generate summary
        console.log('\nVerification Summary:');
        console.log('Total tables:', tables.length);
        console.log('Total rows:', results.reduce((sum, r) => sum + r.rowCount, 0));
        
        // Check for potential issues
        const issues = results.filter(r => 
            r.rowCount !== r.uniqueRows || 
            r.nullIds > 0 ||
            Object.values(r.fivemIdentifiers).every(v => v === null)
        );

        if (issues.length > 0) {
            console.log('\nPotential Issues Found:');
            issues.forEach(issue => {
                console.log(`Table ${issue.table}:`);
                if (issue.rowCount !== issue.uniqueRows) {
                    console.log('  - Contains duplicate rows');
                }
                if (issue.nullIds > 0) {
                    console.log('  - Contains NULL IDs');
                }
                if (Object.values(issue.fivemIdentifiers).every(v => v === null)) {
                    console.log('  - No FiveM identifiers found');
                }
            });
        } else {
            console.log('\nNo major issues found.');
        }

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Run verification if called directly
if (require.main === module) {
    verify();
}

module.exports = { verify };
