declare module 'duckdb-handler' {
    interface QueryOptions {
        timeout?: number;
        parameters?: any[];
    }

    interface MigrationOptions {
        batchSize?: number;
        skipForeignKeys?: boolean;
        validateData?: boolean;
        backupExisting?: boolean;
    }

    interface DatabaseStats {
        queryCount: number;
        averageQueryTime: number;
        peakMemoryUsage: number;
        tableCount: number;
        databaseSize: number;
    }

    // MySQL-async compatible exports
    export function mysql_fetch_all<T = any>(query: string, params?: any[]): Promise<T[]>;
    export function mysql_execute(query: string, params?: any[]): Promise<{ affectedRows: number }>;
    export function mysql_insert(query: string, params?: any[]): Promise<{ insertId: number }>;
    
    // oxmysql compatible exports
    export function query<T = any>(query: string, params?: any[]): Promise<T[]>;
    export function execute(query: string, params?: any[]): Promise<{ affectedRows: number }>;
    export function insert(query: string, params?: any[]): Promise<number>;
    export function scalar<T = any>(query: string, params?: any[]): Promise<T>;
    export function single<T = any>(query: string, params?: any[]): Promise<T>;
    export function transaction(queries: { query: string; params?: any[]; }[]): Promise<any[]>;

    // DuckDB-specific exports
    export function getStats(): Promise<DatabaseStats>;
    export function backup(path: string): Promise<boolean>;
    export function restore(path: string): Promise<boolean>;
    export function vacuum(): Promise<void>;
    export function analyze(table?: string): Promise<void>;

    // Migration utilities
    export function migrate(options?: MigrationOptions): Promise<{
        success: boolean;
        tablesProcessed: number;
        rowsMigrated: number;
        errors: string[];
    }>;
}

// Extend FiveM's global namespace
declare namespace Cfx {
    interface ExportFunctions {
        'duckdb-handler': {
            query: <T = any>(query: string, params?: any[]) => Promise<T[]>;
            execute: (query: string, params?: any[]) => Promise<{ affectedRows: number }>;
            insert: (query: string, params?: any[]) => Promise<number>;
            scalar: <T = any>(query: string, params?: any[]) => Promise<T>;
            single: <T = any>(query: string, params?: any[]) => Promise<T>;
            transaction: (queries: { query: string; params?: any[]; }[]) => Promise<any[]>;
        }
    }
}
