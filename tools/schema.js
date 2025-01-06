const duckdb = require('duckdb');
const path = require('path');
const fs = require('fs').promises;

class SchemaManager {
    constructor(dbPath) {
        this.db = new duckdb.Database(dbPath);
        this.migrationsPath = path.join(process.cwd(), 'migrations');
    }

    async init() {
        // Create migrations table if it doesn't exist
        await this.execute(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INTEGER PRIMARY KEY,
                version VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checksum VARCHAR(64) NOT NULL
            )
        `);
    }

    async execute(query) {
        return new Promise((resolve, reject) => {
            this.db.all(query, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    async getCurrentVersion() {
        const result = await this.execute(`
            SELECT version 
            FROM schema_migrations 
            ORDER BY id DESC 
            LIMIT 1
        `);
        return result[0]?.version || '0';
    }

    async getMigrationFiles() {
        await fs.mkdir(this.migrationsPath, { recursive: true });
        const files = await fs.readdir(this.migrationsPath);
        return files
            .filter(f => f.endsWith('.sql'))
            .sort((a, b) => {
                const versionA = parseInt(a.split('_')[0]);
                const versionB = parseInt(b.split('_')[0]);
                return versionA - versionB;
            });
    }

    async calculateChecksum(content) {
        const crypto = require('crypto');
        return crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');
    }

    async applyMigration(file) {
        const content = await fs.readFile(path.join(this.migrationsPath, file), 'utf8');
        const version = file.split('_')[0];
        const name = file.split('_')[1].replace('.sql', '');
        const checksum = await this.calculateChecksum(content);

        // Start transaction
        await this.execute('BEGIN TRANSACTION');

        try {
            // Apply migration
            await this.execute(content);

            // Record migration
            await this.execute(`
                INSERT INTO schema_migrations (version, name, checksum)
                VALUES ('${version}', '${name}', '${checksum}')
            `);

            await this.execute('COMMIT');
            console.log(`Applied migration: ${file}`);
        } catch (error) {
            await this.execute('ROLLBACK');
            throw error;
        }
    }

    async migrate() {
        await this.init();
        const currentVersion = await this.getCurrentVersion();
        const files = await this.getMigrationFiles();

        console.log(`Current schema version: ${currentVersion}`);
        
        let appliedCount = 0;
        for (const file of files) {
            const version = file.split('_')[0];
            if (version > currentVersion) {
                await this.applyMigration(file);
                appliedCount++;
            }
        }

        if (appliedCount === 0) {
            console.log('Database schema is up to date');
        } else {
            console.log(`Applied ${appliedCount} migration(s)`);
        }
    }

    async createMigration(name) {
        const files = await this.getMigrationFiles();
        const lastVersion = files.length > 0 
            ? parseInt(files[files.length - 1].split('_')[0]) 
            : 0;
        const newVersion = (lastVersion + 1).toString().padStart(3, '0');
        const filename = `${newVersion}_${name}.sql`;
        const filePath = path.join(this.migrationsPath, filename);

        await fs.writeFile(filePath, `-- Migration: ${name}\n-- Version: ${newVersion}\n\n`);
        console.log(`Created migration file: ${filename}`);
        return filename;
    }

    async verifyMigrations() {
        const applied = await this.execute('SELECT * FROM schema_migrations ORDER BY id');
        const files = await this.getMigrationFiles();
        const issues = [];

        for (const migration of applied) {
            const file = files.find(f => f.startsWith(migration.version));
            if (!file) {
                issues.push(`Missing file for applied migration: ${migration.version}`);
                continue;
            }

            const content = await fs.readFile(path.join(this.migrationsPath, file), 'utf8');
            const checksum = await this.calculateChecksum(content);
            if (checksum !== migration.checksum) {
                issues.push(`Checksum mismatch for migration: ${file}`);
            }
        }

        if (issues.length > 0) {
            console.error('Migration verification failed:');
            issues.forEach(issue => console.error(`- ${issue}`));
            return false;
        }

        console.log('All migrations verified successfully');
        return true;
    }

    close() {
        return new Promise((resolve) => {
            this.db.close(() => resolve());
        });
    }
}

async function main() {
    const command = process.argv[2];
    const dbPath = path.join(process.cwd(), '..', 'database.duckdb');
    const manager = new SchemaManager(dbPath);

    try {
        switch (command) {
            case 'create':
                const name = process.argv[3];
                if (!name) {
                    throw new Error('Migration name required');
                }
                await manager.createMigration(name);
                break;

            case 'migrate':
                await manager.migrate();
                break;

            case 'verify':
                await manager.verifyMigrations();
                break;

            case 'status':
                const version = await manager.getCurrentVersion();
                const files = await manager.getMigrationFiles();
                console.log(`Current version: ${version}`);
                console.log(`Available migrations: ${files.length}`);
                console.log('Pending migrations:');
                files
                    .filter(f => f.split('_')[0] > version)
                    .forEach(f => console.log(`- ${f}`));
                break;

            default:
                console.error('Valid commands: create, migrate, verify, status');
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await manager.close();
    }
}

if (require.main === module) {
    main();
}

module.exports = SchemaManager;
