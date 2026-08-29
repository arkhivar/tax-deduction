import pg, { Pool } from 'pg';

// Override the 'date' type parser (OID 1082) to return the raw "yyyy-mm-dd"
// string from PostgreSQL instead of a JavaScript Date object.
//
// node-postgres parses date columns into Date objects at midnight in the
// server's local timezone, which then serialize to JSON as ISO 8601 timestamps
// like "1984-07-21T20:00:00.000Z". This causes two bugs on the client:
//   1. The timezone shift moves the date back by one day.
//   2. The DateInput component expects plain "yyyy-mm-dd" and can't match the
//      timestamp, so date fields appear empty after save-and-reload.
// Returning the raw string avoids the Date conversion entirely.
pg.types.setTypeParser(pg.types.builtins.DATE, (val) => val);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'knd_app',
  password: process.env.DB_PASSWORD || 'knd_secure_2026',
  database: process.env.DB_NAME || 'knd_tax',
});

export { pool };
