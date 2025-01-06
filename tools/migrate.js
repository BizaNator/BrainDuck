const duckdb = require('duckdb');
const path = require('path');
const fs = require('fs').promises;

// Configuration loader
async function loadConfig() {
    try {
        const configPath = path.join(process.cwd(), 'migration-config.json');
        const configExists = await fs.access(configPath)
            .then(() => true)
            .catch(() => false);
        
        if (configExists) {
            return require(configPath);
        }
    } catch (error) {
        console.warn('Error loading config file:', error.message);
    }

    // Default configuration
    return {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'es_extended',
        port: process.env.MYSQL_PORT || 3306
    };
}

// Configure DuckDB with connection
async function setupDuckDB(config) {
    const dbPath = path.join(process.cwd(), '..', 'database.duckdb');
    console.log(`Creating DuckDB database at: ${dbPath}`);

    return new Promise((resolve, reject) => {
        try {
            const db = new duckdb.Database(dbPath);
            
            // Wrap query execution in a promise
            const executeQuery = (query) => new Promise((resolveQuery, rejectQuery) => {
                db.all(query, (err, result) => {
                    if (err) rejectQuery(err);
                    else resolveQuery(result);
                });
            });

            // Create connection string
            const mysqlConnectionString = 
                `host=${config.host} ` +
                `user=${config.user} ` +
                `password=${config.password} ` +
                `port=${config.port} ` +
                `database=${config.database}`;

            resolve({
                db,
                executeQuery,
                mysqlConnectionString
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to format bytes
function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(100 * (bytes / Math.pow(1024, i))) / 100 + ' ' + sizes[i];
}

// Helper function to show progress
function showProgress(table, current, total) {
    const percentage = Math.round((current / total) * 100);
    process.stdout.write(`\rMigrating table ${table}: ${percentage}% complete`);
    if (current === total) {
        process.stdout.write('\n');
    }
}

// Setup logging
function setupLogging(config) {
    const logConfig = config.logging || { level: 'info', console: true };
    const logFile = logConfig.file ? fs.createWriteStream(logConfig.file, { flags: 'a' }) : null;

    return {
        info: (message) => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] INFO: ${message}`;
            if (logConfig.console) console.log(logMessage);
            if (logFile) logFile.write(logMessage + '\n');
        },
        warn: (message) => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] WARN: ${message}`;
            if (logConfig.console) console.warn(logMessage);
            if (logFile) logFile.write(logMessage + '\n');
        },
        error: (message) => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ERROR: ${message}`;
            if (logConfig.console) console.error(logMessage);
            if (logFile) logFile.write(logMessage + '\n');
        },
        close: () => {
            if (logFile) logFile.end();
        }
    };
}

// Create backup of existing database
async function createBackup(db, config, logger) {
    if (!config.options?.createBackup) return;

    const backupDir = config.options.backupPath || './backups';
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.duckdb`);

    logger.info(`Creating backup at: ${backupPath}`);
    
    return new Promise((resolve, reject) => {
        db.all(`EXPORT DATABASE '${backupPath}'`, (err) => {
            if (err) {
                logger.error(`Backup failed: ${err.message}`);
                reject(err);
            } else {
                logger.info('Backup completed successfully');
                resolve(backupPath);
            }
        });
    });
}

async function migrate() {
    let logger;
    try {
        // Load configuration
        const config = await loadConfig();
        
        // Setup logging
        logger = setupLogging(config);
        logger.info('Starting MySQL to DuckDB migration...');
        logger.info('Configuration loaded');

        // Setup DuckDB connection
        const { db, executeQuery, mysqlConnectionString } = await setupDuckDB(config);
        logger.info('DuckDB initialized');

        // Create backup if enabled
        if (config.options?.createBackup) {
            await createBackup(db, config, logger);
        }

        // Start migration process
        logger.info('\nStarting migration process...');
        
        // Attach MySQL database with timeout
        const timeout = config.options?.timeout || 300000; // Default 5 minutes
        await Promise.race([
            executeQuery(`ATTACH '${mysqlConnectionString}' AS mysqldb (TYPE MYSQL)`),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('MySQL connection timeout')), timeout)
            )
        ]);
        logger.info('MySQL database attached successfully');

        // Get list of tables, excluding skipped ones
        const skipTables = config.options?.skipTables || [];
        const tables = await executeQuery(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = '${config.database}'
            AND table_name NOT IN (${skipTables.map(t => `'${t}'`).join(',') || "''"})
        `);
        
        logger.info(`Found ${tables.length} tables to migrate\n`);

        // Copy all tables from MySQL to DuckDB
        logger.info('Copying data from MySQL to DuckDB...');
        await executeQuery(`COPY FROM DATABASE mysqldb TO database`);
        
        // Verify migration if enabled
        if (config.options?.verifyMigration !== false) {
            logger.info('\nVerifying migration...');
            let totalRecords = 0;
            let mismatchedTables = 0;

            for (const table of tables) {
                const tableName = table.table_name;
                const [mysqlCount] = await executeQuery(`
                    SELECT COUNT(*) as count 
                    FROM mysql_query('mysqldb', 'SELECT COUNT(*) as count FROM ${tableName}')
                `);
                const [duckdbCount] = await executeQuery(`
                    SELECT COUNT(*) as count 
                    FROM ${tableName}
                `);

                totalRecords += parseInt(duckdbCount.count);
                logger.info(`Table ${tableName}:`);
                logger.info(`  MySQL records: ${mysqlCount.count}`);
                logger.info(`  DuckDB records: ${duckdbCount.count}`);
                
                if (mysqlCount.count !== duckdbCount.count) {
                    logger.warn(`  WARNING: Record count mismatch in table ${tableName}`);
                    mismatchedTables++;
                }
            }

            logger.info(`\nMigration Summary:`);
            logger.info(`  Total tables processed: ${tables.length}`);
            logger.info(`  Total records migrated: ${totalRecords}`);
            logger.info(`  Tables with mismatches: ${mismatchedTables}`);
        }

        // Get database size
        const [size] = await executeQuery(`
            SELECT pg_database_size(current_database()) as size
        `);
        logger.info(`\nFinal database size: ${formatBytes(size.size)}`);

        // Detach MySQL database and close connections
        await executeQuery('DETACH DATABASE mysqldb');
        logger.info('\nMySQL database detached');

        // Close database connection
        await new Promise((resolve) => {
            db.close((err) => {
                if (err) {
                    logger.error(`Error closing database: ${err.message}`);
                } else {
                    logger.info('Migration completed successfully!');
                }
                resolve();
            });
        });

    } catch (error) {
        if (logger) {
            logger.error(`Migration failed: ${error.message}`);
            if (error.stack) {
                logger.error(`Stack trace: ${error.stack}`);
            }
        } else {
            console.error('Migration failed:', error);
        }
        process.exit(1);
    } finally {
        if (logger) {
            logger.close();
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    migrate();
}

module.exports = { migrate };
