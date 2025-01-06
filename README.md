# DuckDB Handler for FiveM

A drop-in replacement for MySQL in FiveM using DuckDB, providing compatibility with `mysql-async` and `oxmysql` exports. Includes a built-in database management UI for real-time monitoring and administration.

## Features

- **MySQL 5.7 Command Compatibility**: Supports common MySQL commands used in FiveM resources
- **Drop-in Replacement**: Compatible with existing `mysql-async` and `oxmysql` exports
- **Built-in Management UI**: Web-based interface for database operations
- **Performance Monitoring**: Real-time tracking of query execution and database performance
- **Persistent Storage**: Data stored in a local `.duckdb` file

## Installation

1. Clone this repository into your FiveM resources folder:
   ```bash
   cd resources
   git clone https://github.com/yourusername/duckdb-handler
   ```

2. Install dependencies:
   ```bash
   cd duckdb-handler
   npm install
   ```

3. Build the UI:
   ```bash
   npm run build
   ```

4. Add to your `server.cfg`:
   ```cfg
   ensure duckdb-handler
   ```

## Configuration

### ACE Permissions

Add the following to your `server.cfg` to control access to the database management UI:

```cfg
# Database admin permission
add_ace group.admin db.admin allow
```

### Resource Configuration

The database file is automatically created at `resources/duckdb-handler/database.duckdb`.

## Usage

### In-Game Commands

- `/dbadmin` - Open the database management UI (requires `db.admin` ACE permission)
- Default keybinding: F7 (configurable)

### Exports Example (Lua)

```lua
-- mysql-async style
exports['duckdb-handler']:mysql_fetch_all("SELECT * FROM users WHERE id = ?", {1})
exports['duckdb-handler']:mysql_execute("UPDATE users SET name = ? WHERE id = ?", {'John', 1})
exports['duckdb-handler']:mysql_insert("INSERT INTO users (name) VALUES (?)", {'John'})

-- oxmysql style
exports['duckdb-handler']:query("SELECT * FROM users WHERE id = ?", {1})
exports['duckdb-handler']:execute("UPDATE users SET name = ? WHERE id = ?", {'John', 1})
exports['duckdb-handler']:insert("INSERT INTO users (name) VALUES (?)", {'John'})
exports['duckdb-handler']:scalar("SELECT COUNT(*) FROM users")
```

### Management UI Features

- Execute SQL queries
- View query results
- Monitor database performance
- Format SQL queries
- Real-time data editing

## Development

### Running in Development Mode

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

## Compatibility Notes

### Supported MySQL Features

- Basic SQL operations (SELECT, INSERT, UPDATE, DELETE)
- JOINs and subqueries
- Transactions
- Common MySQL functions
- AUTO_INCREMENT behavior (simulated)

### Unsupported Features

- Stored procedures
- Views (limited support)
- Some MySQL-specific functions

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure the resource folder has write permissions
   - Verify ACE permissions are correctly set

2. **UI Not Opening**
   - Check F8 console for JavaScript errors
   - Verify ACE permissions

3. **Query Errors**
   - Check query syntax compatibility
   - Review error messages in server console

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
