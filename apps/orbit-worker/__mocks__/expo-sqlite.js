const memoryTables = new Map();

class MockDatabase {
  execSync(sql) {
    if (sql.includes('CREATE TABLE')) {
      const match = sql.match(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/i);
      if (match) {
        const tableName = match[1];
        if (!memoryTables.has(tableName)) {
          memoryTables.set(tableName, []);
        }
      }
    }
  }

  runSync(sql, params = []) {
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const match = sql.match(/INSERT INTO\s+(\w+)/i);
      if (match) {
        const tableName = match[1];
        const table = memoryTables.get(tableName) || [];
        const item = {
          id: params[0],
          server_id: params[1],
          kind: params[2],
          payload_json: params[3],
          created_at: params[4],
          status: params[5] || 'pending',
          attempts: params[6] || 0,
          last_error: params[7] || null,
          next_attempt_at: params[8] || null,
        };
        table.push(item);
        memoryTables.set(tableName, table);
      }
    } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
      const match = sql.match(/UPDATE\s+(\w+)/i);
      if (match) {
        const tableName = match[1];
        const table = memoryTables.get(tableName) || [];
        const id = params[params.length - 1];
        for (const row of table) {
          if (row.id === id) {
            row.status = params[0];
            if (params.length > 2) {
              row.last_error = params[1];
              row.attempts += 1;
            }
          }
        }
      }
    }
  }

  getAllSync(sql, params = []) {
    if (sql.includes('FROM outbox')) {
      const table = memoryTables.get('outbox') || [];
      let results = [...table];
      if (sql.includes("status = 'pending'")) {
        results = results.filter(r => r.status === 'pending');
      }
      if (sql.includes('ORDER BY created_at ASC')) {
        results.sort((a, b) => a.created_at.localeCompare(b.created_at));
      }
      if (sql.includes('LIMIT 1')) {
        results = results.slice(0, 1);
      }
      return results;
    }
    return [];
  }

  getFirstSync(sql, params = []) {
    const all = this.getAllSync(sql, params);
    return all[0] || null;
  }
}

module.exports = {
  openDatabaseSync: () => new MockDatabase(),
  __clearMockMemory: () => memoryTables.clear(),
};
