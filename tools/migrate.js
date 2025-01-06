const mysql = require('mysql2/promise');
const duckdb = require('duckdb');
const path = require('path');
const readline = require('readline');

// Configure MySQL connection
const mysqlConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'es_extended'
};

// Configure DuckDB
const dbPath = path.join(process.cwd(), '..', 'database.duckdb');
const db = new duckdb.Database(dbPath);

// Helper function to execute DuckDB queries
async function executeDuckDB(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

// Helper function to get MySQL table schema
async function getMySQLSchema(connection, tableName) {
    const [rows] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
    return rows[0]['Create Table'];
}

// Convert MySQL schema to DuckDB schema
function convertSchema(mysqlSchema) {
    return mysqlSchema
        .replace(/AUTO_INCREMENT/gi, '')
        .replace(/ENGINE=\w+/gi, '')
        .replace(/DEFAULT CURRENT_TIMESTAMP/gi, 'DEFAULT CURRENT_TIMESTAMP')
        .replace(/int\(\d+\)/gi, 'INTEGER')
        .replace(/datetime/gi, 'TIMESTAMP')
        .replace(/longtext/gi, 'TEXT')
        .replace(/tinyint\(\d+\)/gi, 'BOOLEAN')
        .replace(/CHARSET=\w+/gi, '')
        .replace(/COLLATE=\w+/gi, '');
}

async function migrate() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('Starting MySQL to DuckDB migration...');

    try {
        // Connect to MySQL
        const connection = await mysql.createConnection(mysqlConfig);
        console.log('Connected to MySQL database');

        // Get all tables
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(table => Object.values(table)[0]);

        console.log(`Found ${tableNames.length} tables to migrate`);

        // Migrate each table
        for (const tableName of tableNames) {
            console.log(`\nMigrating table: ${tableName}`);

            // Get and convert schema
            const mysqlSchema = await getMySQLSchema(connection, tableName);
            const duckdbSchema = convertSchema(mysqlSchema);

            // Create table in DuckDB
            await executeDuckDB(duckdbSchema);

            // Get data from MySQL
            const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
            
            if (rows.length > 0) {
                // Generate insert statement
                const columns = Object.keys(rows[0]).join(', ');
                const placeholders = Array(Object.keys(rows[0]).length).fill('?').join(', ');
                
                // Insert data in batches
                const batchSize = 1000;
                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);
                    for (const row of batch) {
                        await executeDuckDB(
                            `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
                            Object.values(row)
                        );
                    }
                    console.log(`Migrated ${Math.min(i + batchSize, rows.length)}/${rows.length} rows in ${tableName}`);
                }
            }
        }

        console.log('\nMigration completed successfully!');
        connection.end();
        db.close();

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }

    rl.close();
}

// Run migration if called directly
if (require.main === module) {
    migrate();
}

module.exports = { migrate };
