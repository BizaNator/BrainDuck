// MySQL compatibility layer
const { executeQuery } = require('./index.js');

// Helper to format results like MySQL
function formatMySQLResult(result, isInsert = false) {
    if (isInsert && result && result.length > 0) {
        return { insertId: result[0].id, affectedRows: 1 };
    }
    return result;
}

// mysql-async compatibility exports
exports('mysql_execute', async (query, params = []) => {
    try {
        const result = await executeQuery(query, params);
        return formatMySQLResult(result);
    } catch (error) {
        console.error('mysql_execute error:', error);
        throw error;
    }
});

exports('mysql_fetch_all', async (query, params = []) => {
    try {
        return await executeQuery(query, params);
    } catch (error) {
        console.error('mysql_fetch_all error:', error);
        throw error;
    }
});

exports('mysql_insert', async (query, params = []) => {
    try {
        const result = await executeQuery(query, params);
        return formatMySQLResult(result, true);
    } catch (error) {
        console.error('mysql_insert error:', error);
        throw error;
    }
});

// oxmysql compatibility exports
exports('execute', async (query, params = []) => {
    return await exports.mysql_execute(query, params);
});

exports('query', async (query, params = []) => {
    return await exports.mysql_fetch_all(query, params);
});

exports('insert', async (query, params = []) => {
    return await exports.mysql_insert(query, params);
});

exports('scalar', async (query, params = []) => {
    try {
        const result = await executeQuery(query, params);
        return result && result[0] ? Object.values(result[0])[0] : null;
    } catch (error) {
        console.error('scalar error:', error);
        throw error;
    }
});

exports('single', async (query, params = []) => {
    try {
        const results = await executeQuery(query, params);
        return results && results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('single error:', error);
        throw error;
    }
});

// Transaction support
exports('transaction', async (queries) => {
    try {
        await executeQuery('BEGIN TRANSACTION');
        const results = [];
        
        for (const query of queries) {
            const result = await executeQuery(query.query, query.params || []);
            results.push(result);
        }
        
        await executeQuery('COMMIT');
        return results;
    } catch (error) {
        await executeQuery('ROLLBACK');
        console.error('Transaction error:', error);
        throw error;
    }
});
