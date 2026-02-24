/**
 * Mock Cloudflare D1 Database
 *
 * Simulates D1's prepare/bind/first/all/run query interface
 * with configurable responses per test.
 */

/**
 * Create a mock D1 database instance
 * @returns {Object} Mock D1 database with query tracking
 */
export function createMockD1() {
  const queryLog = [];
  const responses = new Map();

  const db = {
    _queryLog: queryLog,
    _responses: responses,

    /**
     * Set a canned response for a query pattern
     * @param {string} pattern - SQL substring to match
     * @param {Object} response - Response to return
     */
    setResponse(pattern, response) {
      responses.set(pattern, response);
    },

    /**
     * Get all recorded queries
     * @returns {Array} Query log
     */
    getQueries() {
      return [...queryLog];
    },

    /**
     * Clear query log and responses
     */
    reset() {
      queryLog.length = 0;
      responses.clear();
    },

    prepare: jest.fn(function (sql) {
      const statement = {
        _sql: sql,
        _bindings: [],

        bind: jest.fn(function (...params) {
          statement._bindings = params;
          return statement;
        }),

        first: jest.fn(async function (column) {
          queryLog.push({ sql, bindings: [...statement._bindings], method: 'first' });

          for (const [pattern, resp] of responses) {
            if (sql.includes(pattern)) {
              if (column && resp) {
                return resp[column];
              }
              return resp;
            }
          }
          return null;
        }),

        all: jest.fn(async function () {
          queryLog.push({ sql, bindings: [...statement._bindings], method: 'all' });

          for (const [pattern, resp] of responses) {
            if (sql.includes(pattern)) {
              return { results: Array.isArray(resp) ? resp : [resp] };
            }
          }
          return { results: [] };
        }),

        run: jest.fn(async function () {
          queryLog.push({ sql, bindings: [...statement._bindings], method: 'run' });

          return {
            success: true,
            meta: { changes: 1, last_row_id: 1, duration: 0.5 }
          };
        })
      };

      return statement;
    })
  };

  return db;
}
