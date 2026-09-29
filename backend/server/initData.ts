import { pool } from './db';
import { TOPICS } from './data/sheetData';
import { CHALLENGES } from './data/practiceData';

export async function populateRealtimeDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Verifying and populating PostgreSQL database with real-time data...');

    // 1. Purge any legacy mock users and mock activity logs
    await client.query(`
      DELETE FROM users WHERE username IN ('alex_sre', 'priya_k8s', 'david_kim');
      DELETE FROM user_completions WHERE username IN ('alex_sre', 'priya_k8s', 'david_kim');
      DELETE FROM user_lab_solutions WHERE username IN ('alex_sre', 'priya_k8s', 'david_kim');
      DELETE FROM activity_logs WHERE id IN ('act_101', 'act_102', 'act_103', 'act_104') OR username IN ('alex_sre', 'priya_k8s', 'david_kim');
    `);

    // 2. Ensure initial Admin account exists in users table
    await client.query(`
      INSERT INTO users (id, username, display_name, email, password_hash, role, experience_level, status, last_device_os)
      VALUES (
        'usr_admin',
        'admin',
        'Super Admin',
        'admin@huntdevops.io',
        'admin123',
        'Admin',
        'Advanced',
        'Active',
        'Cloud Workstation'
      )
      ON CONFLICT (username) DO NOTHING;
    `);

    // 3. Populate Curriculum Topics if empty or sync
    const topicsCountRes = await client.query('SELECT COUNT(*) FROM topics');
    const topicsCount = parseInt(topicsCountRes.rows[0].count, 10);
    if (topicsCount === 0) {
      console.log(`📚 Populating ${TOPICS.length} curriculum topics into Cloud SQL topics table...`);
      for (const t of TOPICS) {
        await client.query(
          `INSERT INTO topics (id, title, subtitle, data_json, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             subtitle = EXCLUDED.subtitle,
             data_json = EXCLUDED.data_json,
             updated_at = NOW()`,
          [t.id, t.title, t.subtitle || '', JSON.stringify(t)]
        );
      }
      console.log('✅ Curriculum topics populated into Cloud SQL topics table.');
    }

    // 4. Populate Incident Troubleshooting Labs if empty or sync
    const labsCountRes = await client.query('SELECT COUNT(*) FROM incident_labs');
    const labsCount = parseInt(labsCountRes.rows[0].count, 10);
    if (labsCount === 0) {
      console.log(`🧪 Populating ${CHALLENGES.length} incident troubleshooting labs into Cloud SQL incident_labs table...`);
      for (const c of CHALLENGES) {
        await client.query(
          `INSERT INTO incident_labs (id, title, topic, experience_level, data_json, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             topic = EXCLUDED.topic,
             experience_level = EXCLUDED.experience_level,
             data_json = EXCLUDED.data_json,
             updated_at = NOW()`,
          [c.id, c.title, c.topic, c.experienceLevel || 'Intermediate', JSON.stringify(c)]
        );
      }
      console.log('✅ Incident troubleshooting labs populated into Cloud SQL incident_labs table.');
    }

    console.log('🎉 PostgreSQL Cloud SQL real-time data sync completed successfully.');
  } catch (err) {
    console.error('⚠️ Error during real-time database initialization:', err);
  } finally {
    client.release();
  }
}
