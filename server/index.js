const duckdb = require('duckdb');
const path = require('path');

// Initialize DuckDB with a persistent database file
const dbPath = path.join(GetResourcePath(GetCurrentResourceName()), 'database.duckdb');
const db = new duckdb.Database(dbPath);

// Core query execution function
async function executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error(`Query error: ${err.message}`);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Basic exports for direct DuckDB access
exports('query', async (query, params) => {
    try {
        return await executeQuery(query, params);
    } catch (error) {
        console.error(`Query execution failed: ${error.message}`);
        throw error;
    }
});

// Initialize database tables if they don't exist
async function initializeDatabase() {
    try {
        // Example table creation - modify according to your needs
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                identifier VARCHAR(50) UNIQUE,
                license VARCHAR(50),
                name VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error(`Database initialization failed: ${error.message}`);
        throw error;
    }
}

// Call initialization when resource starts
on('onResourceStart', (resourceName) => {
    if (resourceName === GetCurrentResourceName()) {
        initializeDatabase()
            .then(() => console.log('DuckDB handler started successfully'))
            .catch(err => console.error('Failed to start DuckDB handler:', err));
    }
});

// Cleanup on resource stop
on('onResourceStop', (resourceName) => {
    if (resourceName === GetCurrentResourceName()) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database connection closed');
            }
        });
    }
});
