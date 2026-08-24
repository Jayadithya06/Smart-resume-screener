const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const dbPath = path.join(__dirname, "..", "screener.db");

let database;

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file =>
      path.join(
        __dirname,
        "..",
        "node_modules",
        "sql.js",
        "dist",
        file
      )
  });

  if (fs.existsSync(dbPath)) {
    const file = fs.readFileSync(dbPath);
    database = new SQL.Database(file);
  } else {
    database = new SQL.Database();
  }

  database.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      name TEXT,
      email TEXT,
      phone TEXT,
      skills TEXT,
      experience TEXT,
      education TEXT,
      experience_years REAL,
      raw_text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      score REAL NOT NULL,
      summary TEXT,
      matched_skills TEXT,
      missing_skills TEXT,
      strengths TEXT,
      concerns TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDatabase();
}

function saveDatabase() {
  const data = database.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function run(sql, params = []) {
  database.run(sql, params);
  saveDatabase();
}

function get(sql, params = []) {
  const statement = database.prepare(sql);
  statement.bind(params);

  let result = null;

  if (statement.step()) {
    result = statement.getAsObject();
  }

  statement.free();

  return result;
}

function all(sql, params = []) {
  const statement = database.prepare(sql);
  statement.bind(params);

  const rows = [];

  while (statement.step()) {
    rows.push(statement.getAsObject());
  }

  statement.free();

  return rows;
}

module.exports = {
  initDatabase,
  run,
  get,
  all
};