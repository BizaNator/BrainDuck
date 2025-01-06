const { expect } = require('chai');
const path = require('path');
const duckdb = require('duckdb');

// Create test database
const dbPath = path.join(__dirname, 'test.duckdb');
const db = new duckdb.Database(dbPath);

describe('DuckDB Handler Tests', () => {
    before(async () => {
        // Set up test database
        await new Promise((resolve, reject) => {
            db.all(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    identifier VARCHAR(50) UNIQUE,
                    name VARCHAR(50)
                )
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    after(async () => {
        // Clean up test database
        db.close();
    });

    describe('Basic Query Operations', () => {
        it('should insert and retrieve data', async () => {
            // Insert test data
            await new Promise((resolve, reject) => {
                db.all(`
                    INSERT INTO users (identifier, name) 
                    VALUES ('steam:123', 'Test User')
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Retrieve and verify data
            const result = await new Promise((resolve, reject) => {
                db.all('SELECT * FROM users WHERE identifier = ?', ['steam:123'], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(1);
            expect(result[0].name).to.equal('Test User');
        });

        it('should handle MySQL-style AUTO_INCREMENT behavior', async () => {
            const result = await new Promise((resolve, reject) => {
                db.all(`
                    INSERT INTO users (identifier, name) 
                    VALUES ('steam:456', 'Another User')
                    RETURNING id
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            expect(result).to.be.an('array');
            expect(result[0]).to.have.property('id');
            expect(result[0].id).to.be.a('number');
        });
    });

    describe('MySQL Compatibility', () => {
        it('should support MySQL-style LIMIT syntax', async () => {
            const result = await new Promise((resolve, reject) => {
                db.all('SELECT * FROM users LIMIT 1', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(1);
        });

        it('should support MySQL-style UPDATE syntax', async () => {
            await new Promise((resolve, reject) => {
                db.all(`
                    UPDATE users 
                    SET name = 'Updated Name' 
                    WHERE identifier = 'steam:123'
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            const result = await new Promise((resolve, reject) => {
                db.all('SELECT name FROM users WHERE identifier = ?', ['steam:123'], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            expect(result[0].name).to.equal('Updated Name');
        });
    });
});
