import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL Database Pool setup
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/huntdevops';

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let isPostgresAvailable = false;

export async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('🐘 PostgreSQL connected successfully!');
    isPostgresAvailable = true;

    // Run Auto-Migrations for PostgreSQL Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(150),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Learner',
        experience_level VARCHAR(50) DEFAULT 'Beginner',
        status VARCHAR(50) DEFAULT 'Active',
        last_device_os VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS topics (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        subtitle TEXT,
        data_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS incident_labs (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        topic VARCHAR(50) NOT NULL,
        experience_level VARCHAR(50) DEFAULT 'Intermediate',
        data_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_completions (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        question_id VARCHAR(100) NOT NULL,
        completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, question_id)
      );

      CREATE TABLE IF NOT EXISTS user_lab_solutions (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        lab_id VARCHAR(100) NOT NULL,
        solved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, lab_id)
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        details TEXT,
        device_os VARCHAR(100),
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_exp_level ON users(experience_level);
      CREATE INDEX IF NOT EXISTS idx_completions_user ON user_completions(username);
    `);

    client.release();
    console.log('✅ PostgreSQL Schema tables & indexes verified.');
  } catch (error) {
    console.warn('⚠️ PostgreSQL database connection pending. Backend operating with memory/client sync fallbacks.');
    isPostgresAvailable = false;
  }
}

export function getIsPostgresAvailable() {
  return isPostgresAvailable;
}
