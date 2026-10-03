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
    const upper = sql.trim().toUpperCase();
    if (upper.startsWith('INSERT')) {
      const tableName = sql.includes('read_cache') ? 'read_cache' : 'outbox';
      const table = memoryTables.get(tableName) || [];
      if (tableName === 'read_cache') {
        const existingIndex = table.findIndex(r => r.key === params[0]);
        const item = { key: params[0], value: params[1], stored_at: params[2] };
        if (existingIndex >= 0) {
          table[existingIndex] = item;
        } else {
          table.push(item);
        }
      } else {
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
      }
      memoryTables.set(tableName, table);
    } else if (upper.startsWith('DELETE')) {
      const tableName = sql.includes('read_cache') ? 'read_cache' : 'outbox';
      const table = memoryTables.get(tableName) || [];
      if (sql.includes('WHERE key = ?')) {
        const filtered = table.filter(r => r.key !== params[0]);
        memoryTables.set(tableName, filtered);
      } else if (sql.includes('WHERE id = ?')) {
        const filtered = table.filter(r => r.id !== params[0]);
        memoryTables.set(tableName, filtered);
      } else {
        memoryTables.set(tableName, []);
      }
    } else if (upper.startsWith('UPDATE')) {
      const tableName = sql.includes('read_cache') ? 'read_cache' : 'outbox';
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

  getAllSync(sql, params = []) {
    const tableName = sql.includes('FROM read_cache') ? 'read_cache' : sql.includes('FROM outbox') ? 'outbox' : null;
    if (!tableName) return [];
    const table = memoryTables.get(tableName) || [];
    let results = [...table];
    if (sql.includes("key = ?")) {
      results = results.filter(r => r.key === params[0]);
    }
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

  getFirstSync(sql, params = []) {
    const all = this.getAllSync(sql, params);
    return all[0] || null;
  }
}

module.exports = {
  openDatabaseSync: () => new MockDatabase(),
  __clearMockMemory: () => memoryTables.clear(),
};
