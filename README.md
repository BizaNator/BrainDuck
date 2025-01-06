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

4. If migrating from MySQL:
   ```bash
   # Copy the example migration config
   cp migration-config.example.json migration-config.json
   
   # Edit the config file with your MySQL details
   nano migration-config.json
   
   # Initialize migration config
   npm run migrate:init

   # Edit the configuration
   nano migration-config.json

   # Run migration with verification
   npm run migrate:all
   ```

   Additional Migration Commands:
   ```bash
   # Run migration only
   npm run migrate

   # Run verification only
   npm run migrate:verify

   # Backup Management
   npm run backup            # Create a new backup
   npm run backup:create     # Alias for backup
   npm run backup:list      # List all available backups

   # Database Information
   npm run db:status        # Check database health
   npm run db:info          # Show detailed database information
   ```

   Backup files are stored in the `backups` directory with timestamps and can be used for:
   - Regular database snapshots
   - Pre-migration safety copies
   - Version control of database states
   
   Each backup includes:
   - Full database schema
   - All table data
   - Creation timestamp
   - Size information
   - Table count

   ### Schema Management

   The resource includes a schema versioning system to manage database structure:

   ```bash
   # Create a new migration
   npm run schema:create my_migration_name

   # Apply pending migrations
   npm run schema:migrate

   # Check migration status
   npm run schema:status

   # Verify migration integrity
   npm run schema:verify
   ```

   Migration files are stored in the `migrations` directory and follow the format:
   ```sql
   -- Migration: description
   -- Version: 001

   CREATE TABLE example ( ... );
   ```

   Features:
   - Version tracking
   - Checksum verification
   - Rollback support
   - Migration history
   - Automated schema updates

   ### Complete Setup

   To set up a new installation with data migration and schema:
   ```bash
   # One-command setup
   npm run db:setup

   # Or step by step
   npm run migrate:init     # Initialize config
   npm run migrate:all     # Migrate from MySQL
   npm run schema:migrate  # Apply schema updates
   ```

   Migration Configuration Options:
   ```json
   {
       "host": "localhost",      // MySQL host
       "user": "root",          // MySQL username
       "password": "",          // MySQL password
       "database": "braindeadrp", // Database name
       "port": 3306,           // MySQL port
       "options": {
           "createBackup": true,        // Create backup before migration
           "backupPath": "./backups",   // Backup directory
           "verifyMigration": true,     // Verify record counts after migration
           "skipTables": [             // Tables to exclude from migration
               "migrations",
               "temp_logs"
           ],
           "timeout": 300000           // MySQL connection timeout (ms)
       },
       "logging": {
           "level": "info",            // Log level (info, warn, error)
           "file": "./logs/migration.log", // Log file path
           "console": true             // Show logs in console
       }
   }
   ```

   The migration process:
   1. Creates a backup of existing DuckDB database (if enabled)
   2. Establishes direct connection to MySQL
   3. Copies all tables and data in a single operation
   4. Verifies record counts for each table
   5. Generates detailed migration report

5. Add to your `server.cfg`:
   ```cfg
   # Core resource
   ensure duckdb-handler
   
   # Permissions
   add_ace resource.duckdb-handler command.duckdb allow
   ```

6. Verify installation:
   ```bash
   # Check the resource status
   duckdb-handler status
   
   # Run a test query
   duckdb-handler query "SELECT 1 as test"
   ```

### Migration Configuration

The `migration-config.json` file supports the following options:

```json
{
    "host": "MySQL host",
    "user": "MySQL username",
    "password": "MySQL password",
    "database": "Database name",
    "tables": [
        "List of specific tables to migrate",
        "Leave empty to migrate all"
    ],
    "exclude": [
        "Tables to skip during migration"
    ],
    "options": {
        "batchSize": 1000,
        "skipForeignKeys": false,
        "validateData": true,
        "backupExisting": true
    }
}
```

## Configuration

### TypeScript Support

The resource includes full TypeScript definitions for both server-side and client-side development. To use TypeScript in your resource:

1. Install the dependencies:
   ```bash
   npm install --save-dev typescript @types/node @citizenfx/client @citizenfx/server
   ```

2. Add TypeScript configuration:
   ```json
   {
     "compilerOptions": {
       "types": ["@citizenfx/client", "@citizenfx/server"]
     }
   }
   ```

3. Import types in your code:
   ```typescript
   import { QueryOptions } from 'duckdb-handler';

   const options: QueryOptions = {
     timeout: 5000,
     parameters: ['value1', 'value2']
   };
   ```

### Development Setup

1. **Initial Setup**:
   ```bash
   # Install dependencies
   npm install

   # Install git hooks for code quality
   npm run prepare
   ```

2. **Development Workflow**:
   ```bash
   # Start development server (UI + TypeScript + Server)
   npm run dev

   # Type checking only
   npm run type-check

   # Lint code
   npm run lint

   # Format code
   npm run format
   ```

3. **Testing**:
   ```bash
   # Run all tests
   npm test

   # Run specific test file
   npm test tests/db.test.js
   ```

4. **Building**:
   ```bash
   # Clean build
   npm run clean

   # Full production build (includes linting and formatting)
   npm run build

   # Build specific parts
   npm run build:ts    # TypeScript only
   npm run build:web   # Web UI only
   ```

5. **Code Quality**:
   ```bash
   # Check formatting
   npm run format:check

   # Fix linting issues
   npm run lint:fix

   # Run type checker
   npm run type-check
   ```

6. **Development Environment**:

   Recommended VS Code Extensions:
   ```bash
   # Essential
   dbaeumer.vscode-eslint        # ESLint
   esbenp.prettier-vscode        # Prettier
   sumneko.lua                   # Lua Language Server
   
   # Helpful
   eamodio.gitlens              # Git integration
   gruntfuggly.todo-tree        # TODO comments highlighting
   christian-kohler.npm-intellisense # npm support
   ```

   VS Code Settings are provided in `.vscode/settings.json`:
   - Automatic formatting on save
   - ESLint integration
   - TypeScript path mapping
   - File associations for FiveM
   - Lua development settings

7. **Debugging**:
   - Use Visual Studio Code's built-in debugger
   - Add breakpoints in TypeScript files
   - Use the Debug Console to inspect variables
   - Debug configurations included in `.vscode/launch.json`:
     - `Debug Server`: Launch server with debugger
     - `Attach to Server`: Attach to running server
     - `Run Tests`: Debug test suite
     - `Debug Migration`: Debug database migration
     - `Server + Web`: Launch full development environment

   Example debugging session:
   ```bash
   # Start server in debug mode
   npm run dev:server -- --inspect

   # Attach VS Code debugger
   # Press F5 or use Run -> Start Debugging
   ```

   Hot Reloading:
   - TypeScript files are watched and recompiled
   - Server restarts automatically on changes
   - Web UI supports hot module replacement

## Contributing

### Code Style and Quality

This project uses several tools to ensure code quality and consistency:
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **EditorConfig**: Editor settings consistency
- **TypeScript**: Static type checking

Before submitting a PR:
1. Ensure all tests pass: `npm test`
2. Run type checking: `npm run type-check`
3. Format code: `npm run format`
4. Fix any lint issues: `npm run lint:fix`

### Pull Request Process

1. Branch naming convention:
   - `feature/description` for new features
   - `fix/description` for bug fixes
   - `docs/description` for documentation changes

2. Commit messages should follow [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add new database monitoring feature
   fix: resolve concurrent query issue
   docs: update installation instructions
   ```

3. Update documentation:
   - Add JSDoc comments for new functions
   - Update README.md if adding features
   - Include SQL examples for database changes

4. Create a Pull Request:
   - Fill out the PR template
   - Link related issues
   - Add labels (bug, enhancement, etc.)
   - Request review from maintainers

### Development Standards

1. **Testing**:
   - Write tests for new features
   - Maintain 80%+ code coverage
   - Include both unit and integration tests

2. **Performance**:
   - Monitor query execution times
   - Optimize database operations
   - Profile memory usage

3. **Security**:
   - Validate all user input
   - Use parameterized queries
   - Follow FiveM security best practices

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
