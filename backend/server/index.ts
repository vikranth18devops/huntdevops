import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDatabase, getIsPostgresAvailable } from './db';
import { populateRealtimeDatabase } from './initData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// -------------------------------------------------------------
// 1. Healthcheck Endpoint
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: getIsPostgresAvailable() ? 'PostgreSQL (Connected)' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// 2. Authentication Endpoints
// -------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  const { username, displayName, email, password, phone, role, experienceLevel, lastDeviceOS } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  const userObj = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    username: username.trim(),
    displayName: displayName ? displayName.trim() : username.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : null,
    password: password,
    role: role || 'Learner',
    experienceLevel: experienceLevel || 'Beginner',
    status: 'Active',
    lastDeviceOS: lastDeviceOS || 'Desktop Web Browser',
    createdAt: new Date().toISOString().split('T')[0]
  };

  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `INSERT INTO users (id, username, display_name, email, password_hash, role, experience_level, status, last_device_os, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (username) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           experience_level = EXCLUDED.experience_level,
           last_device_os = EXCLUDED.last_device_os,
           phone = EXCLUDED.phone
         RETURNING id, username, display_name as "displayName", email, phone, role, experience_level as "experienceLevel", status, last_device_os as "lastDeviceOS", TO_CHAR(created_at, 'YYYY-MM-DD') as "createdAt"`,
        [userObj.id, userObj.username, userObj.displayName, userObj.email, userObj.password, userObj.role, userObj.experienceLevel, userObj.status, userObj.lastDeviceOS, userObj.phone]
      );

      // Record real activity log in PostgreSQL
      await pool.query(
        `INSERT INTO activity_logs (id, username, action_type, title, details, device_os)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          userObj.username,
          'ACCOUNT_CREATED',
          `New Account Registered: @${userObj.username}`,
          `Email: ${userObj.email}${userObj.phone ? ` | Phone: ${userObj.phone}` : ''} | Experience: ${userObj.experienceLevel}`,
          userObj.lastDeviceOS
        ]
      ).catch(() => {});

      return res.status(201).json({ user: result.rows[0], token: `jwt_${userObj.id}` });
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Username or email already registered.' });
      }
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Failed to create user.' });
    }
  }

  return res.status(503).json({ error: 'Database unavailable' });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password, lastDeviceOS } = req.body;

  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `SELECT id, username, display_name as "displayName", email, phone, role, experience_level as "experienceLevel", status, last_device_os as "lastDeviceOS", TO_CHAR(created_at, 'YYYY-MM-DD') as "createdAt", password_hash
         FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`,
        [username]
      );

      if (result.rows.length > 0) {
        const u = result.rows[0];
        if (u.password_hash === password) {
          delete u.password_hash;

          // Record login activity in PostgreSQL
          const device = lastDeviceOS || u.lastDeviceOS || 'Desktop Web Browser';
          await pool.query(
            `INSERT INTO activity_logs (id, username, action_type, title, details, device_os)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [`act_${Date.now()}_${Math.floor(Math.random() * 1000)}`, u.username, 'USER_LOGIN', `User Signed In: @${u.username}`, `Device: ${device}`, device]
          ).catch(() => {});

          return res.json({ user: u, token: `jwt_${u.id}` });
        }
      }
    } catch (err) {
      console.error('Login query error:', err);
    }
  }

  return res.status(401).json({ error: 'Invalid credentials.' });
});

// -------------------------------------------------------------
// 3. User Management Endpoints (Admin Portal & User Settings)
// -------------------------------------------------------------
app.get('/api/users', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `SELECT id, username, display_name as "displayName", email, phone, role, experience_level as "experienceLevel", status, last_device_os as "lastDeviceOS", TO_CHAR(created_at, 'YYYY-MM-DD') as "createdAt", TO_CHAR(last_active_at, 'YYYY-MM-DD HH24:MI:SS') as "lastActiveAt"
         FROM users ORDER BY created_at DESC`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch users.' });
    }
  }
  return res.json([]);
});

// Create new user from Admin Portal
app.post('/api/users', async (req, res) => {
  const { username, displayName, email, phone, role, experienceLevel, status, password, lastDeviceOS } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required.' });

  const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const uName = username.trim();
  const dName = displayName ? displayName.trim() : uName;
  const uEmail = email ? email.trim() : `${uName}@huntdevops.io`;
  const uRole = role || 'Learner';
  const uExp = experienceLevel || 'Beginner';
  const uStatus = status || 'Active';
  const uDevice = lastDeviceOS || 'Desktop Web Browser';
  const uPassword = password || 'huntdevops2026';

  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `INSERT INTO users (id, username, display_name, email, password_hash, role, experience_level, status, last_device_os, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (username) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           experience_level = EXCLUDED.experience_level,
           status = EXCLUDED.status,
           last_device_os = EXCLUDED.last_device_os,
           phone = EXCLUDED.phone
         RETURNING id, username, display_name as "displayName", email, phone, role, experience_level as "experienceLevel", status, last_device_os as "lastDeviceOS", TO_CHAR(created_at, 'YYYY-MM-DD') as "createdAt"`,
        [id, uName, dName, uEmail, uPassword, uRole, uExp, uStatus, uDevice, phone || null]
      );
      return res.json({ success: true, user: result.rows[0] });
    } catch (err: any) {
      console.error('Error creating user:', err);
      return res.status(400).json({ error: err.message || 'Failed to create user.' });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// Sync user to PostgreSQL database from Admin or Auth
app.post('/api/users/sync', async (req, res) => {
  const { username, displayName, email, phone, role, experienceLevel, status, lastDeviceOS } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required.' });

  const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const uName = username.trim();
  const dName = displayName ? displayName.trim() : uName;
  const uEmail = email ? email.trim() : `${uName}@huntdevops.io`;
  const uRole = role || 'Learner';
  const uExp = experienceLevel || 'Beginner';
  const uStatus = status || 'Active';
  const uDevice = lastDeviceOS || 'Desktop Web Browser';

  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `INSERT INTO users (id, username, display_name, email, password_hash, role, experience_level, status, last_device_os, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (username) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           email = EXCLUDED.email,
           experience_level = EXCLUDED.experience_level,
           status = EXCLUDED.status,
           last_device_os = EXCLUDED.last_device_os,
           phone = EXCLUDED.phone
         RETURNING id, username, display_name as "displayName", email, phone, role, experience_level as "experienceLevel", status, last_device_os as "lastDeviceOS", TO_CHAR(created_at, 'YYYY-MM-DD') as "createdAt"`,
        [id, uName, dName, uEmail, 'user_pwd_hash', uRole, uExp, uStatus, uDevice, phone || null]
      );
      return res.json({ success: true, user: result.rows[0] });
    } catch (err) {
      console.error('Error syncing user:', err);
    }
  }

  return res.json({ success: true });
});

// Delete user from PostgreSQL
app.delete('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;
  if (getIsPostgresAvailable()) {
    try {
      // Find username first to clean up related rows
      const userRes = await pool.query(`SELECT username FROM users WHERE id = $1 OR username = $1`, [userId]);
      if (userRes.rows.length > 0) {
        const uName = userRes.rows[0].username;
        await pool.query(`DELETE FROM user_completions WHERE LOWER(username) = LOWER($1)`, [uName]);
        await pool.query(`DELETE FROM user_lab_solutions WHERE LOWER(username) = LOWER($1)`, [uName]);
        await pool.query(`DELETE FROM activity_logs WHERE LOWER(username) = LOWER($1)`, [uName]);
        await pool.query(`DELETE FROM users WHERE id = $1 OR username = $1`, [userId]);
      }
      return res.json({ success: true, message: 'User deleted from PostgreSQL.' });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ error: err.message || 'Failed to delete user.' });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// Update role (Admin / Learner)
app.put('/api/users/:userId/role', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `UPDATE users SET role = $1 WHERE id = $2 OR username = $2 RETURNING id, username, role`,
        [role, userId]
      );
      return res.json({ success: true, user: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// Update status (Active / Suspended)
app.put('/api/users/:userId/status', async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `UPDATE users SET status = $1 WHERE id = $2 OR username = $2 RETURNING id, username, status`,
        [status, userId]
      );
      return res.json({ success: true, user: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// Update experience level
app.put('/api/users/:userId/experience-level', async (req, res) => {
  const { userId } = req.params;
  const { experienceLevel } = req.body;
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `UPDATE users SET experience_level = $1 WHERE id = $2 OR username = $2 RETURNING id, username, experience_level as "experienceLevel"`,
        [experienceLevel, userId]
      );
      return res.json({ success: true, user: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// Reset user password
app.put('/api/users/:userId/password', async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'newPassword is required.' });

  if (getIsPostgresAvailable()) {
    try {
      await pool.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2 OR username = $2`,
        [newPassword, userId]
      );
      return res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// -------------------------------------------------------------
// 4. Curriculum Topics Endpoints (PostgreSQL topics table)
// -------------------------------------------------------------
app.get('/api/topics', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(`SELECT data_json FROM topics ORDER BY id ASC`);
      if (result.rows.length > 0) {
        return res.json(result.rows.map(r => r.data_json));
      }
    } catch (err) {
      console.error('Error fetching topics from PostgreSQL:', err);
    }
  }
  return res.json([]);
});

app.post('/api/topics', async (req, res) => {
  const { topics } = req.body;
  if (!Array.isArray(topics)) {
    return res.status(400).json({ error: 'Topics payload must be an array.' });
  }

  if (getIsPostgresAvailable()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const topicIds = topics.map(t => t.id);
      if (topicIds.length > 0) {
        await client.query(`DELETE FROM topics WHERE id NOT IN (${topicIds.map((_, i) => `$${i + 1}`).join(',')})`, topicIds);
      } else {
        await client.query(`DELETE FROM topics`);
      }

      for (const t of topics) {
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
      await client.query('COMMIT');
      return res.json({ success: true, message: 'Topics successfully saved to Cloud SQL PostgreSQL.' });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error saving topics to PostgreSQL:', err);
      return res.status(500).json({ error: err.message || 'Failed to save topics.' });
    } finally {
      client.release();
    }
  }

  return res.status(503).json({ error: 'Database unavailable' });
});

app.delete('/api/topics/:id', async (req, res) => {
  const { id } = req.params;
  if (getIsPostgresAvailable()) {
    try {
      await pool.query(`DELETE FROM topics WHERE id = $1`, [id]);
      return res.json({ success: true, message: `Topic ${id} deleted from Cloud SQL.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// -------------------------------------------------------------
// 5. Incident Troubleshooting Labs Endpoints (PostgreSQL incident_labs table)
// -------------------------------------------------------------
app.get('/api/labs', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(`SELECT data_json FROM incident_labs ORDER BY id ASC`);
      if (result.rows.length > 0) {
        return res.json(result.rows.map(r => r.data_json));
      }
    } catch (err) {
      console.error('Error fetching incident labs from PostgreSQL:', err);
    }
  }
  return res.json([]);
});

app.post('/api/labs', async (req, res) => {
  const { labs } = req.body;
  if (!Array.isArray(labs)) {
    return res.status(400).json({ error: 'Labs payload must be an array.' });
  }

  if (getIsPostgresAvailable()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const labIds = labs.map(l => l.id);
      if (labIds.length > 0) {
        await client.query(`DELETE FROM incident_labs WHERE id NOT IN (${labIds.map((_, i) => `$${i + 1}`).join(',')})`, labIds);
      } else {
        await client.query(`DELETE FROM incident_labs`);
      }

      for (const l of labs) {
        await client.query(
          `INSERT INTO incident_labs (id, title, topic, experience_level, data_json, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             topic = EXCLUDED.topic,
             experience_level = EXCLUDED.experience_level,
             data_json = EXCLUDED.data_json,
             updated_at = NOW()`,
          [l.id, l.title, l.topic, l.experienceLevel || 'Intermediate', JSON.stringify(l)]
        );
      }
      await client.query('COMMIT');
      return res.json({ success: true, message: 'Incident labs saved to Cloud SQL PostgreSQL.' });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error saving incident labs to PostgreSQL:', err);
      return res.status(500).json({ error: err.message || 'Failed to save labs.' });
    } finally {
      client.release();
    }
  }

  return res.status(503).json({ error: 'Database unavailable' });
});

app.delete('/api/labs/:id', async (req, res) => {
  const { id } = req.params;
  if (getIsPostgresAvailable()) {
    try {
      await pool.query(`DELETE FROM incident_labs WHERE id = $1`, [id]);
      return res.json({ success: true, message: `Lab ${id} deleted from Cloud SQL.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// -------------------------------------------------------------
// 6. User Progress & Real-time Completions (PostgreSQL tables)
// -------------------------------------------------------------
app.get('/api/progress/:username', async (req, res) => {
  const { username } = req.params;
  const uKey = username.toLowerCase();

  if (getIsPostgresAvailable()) {
    try {
      const compRes = await pool.query(
        `SELECT question_id FROM user_completions WHERE LOWER(username) = $1`,
        [uKey]
      );
      const solvedRes = await pool.query(
        `SELECT lab_id FROM user_lab_solutions WHERE LOWER(username) = $1`,
        [uKey]
      );

      return res.json({
        completedQuestionIds: compRes.rows.map(r => r.question_id),
        solvedLabIds: solvedRes.rows.map(r => r.lab_id)
      });
    } catch (err) {
      console.error('Error fetching progress from PostgreSQL:', err);
    }
  }

  return res.json({
    completedQuestionIds: [],
    solvedLabIds: []
  });
});

app.post('/api/progress/complete-question', async (req, res) => {
  const { username, questionId } = req.body;
  if (!username || !questionId) return res.status(400).json({ error: 'Missing username or questionId' });

  const uKey = username.toLowerCase();

  if (getIsPostgresAvailable()) {
    try {
      await pool.query(
        `INSERT INTO user_completions (username, question_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [uKey, questionId]
      );
      return res.json({ success: true });
    } catch (err) {
      console.error('Error saving completed question:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

app.post('/api/progress/uncomplete-question', async (req, res) => {
  const { username, questionId } = req.body;
  if (!username || !questionId) return res.status(400).json({ error: 'Missing username or questionId' });

  const uKey = username.toLowerCase();

  if (getIsPostgresAvailable()) {
    try {
      await pool.query(
        `DELETE FROM user_completions WHERE LOWER(username) = $1 AND question_id = $2`,
        [uKey, questionId]
      );
      return res.json({ success: true });
    } catch (err) {
      console.error('Error removing completed question:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

app.post('/api/progress/solve-lab', async (req, res) => {
  const { username, labId } = req.body;
  if (!username || !labId) return res.status(400).json({ error: 'Missing username or labId' });

  const uKey = username.toLowerCase();

  if (getIsPostgresAvailable()) {
    try {
      await pool.query(
        `INSERT INTO user_lab_solutions (username, lab_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [uKey, labId]
      );
      return res.json({ success: true });
    } catch (err) {
      console.error('Error saving lab solution:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

app.post('/api/progress/unsolve-lab', async (req, res) => {
  const { username, labId } = req.body;
  if (!username || !labId) return res.status(400).json({ error: 'Missing username or labId' });

  const uKey = username.toLowerCase();

  if (getIsPostgresAvailable()) {
    try {
      await pool.query(
        `DELETE FROM user_lab_solutions WHERE LOWER(username) = $1 AND lab_id = $2`,
        [uKey, labId]
      );
      return res.json({ success: true });
    } catch (err) {
      console.error('Error removing lab solution:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

app.post('/api/progress/reset', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Missing username' });

  const uKey = username.toLowerCase();

  if (getIsPostgresAvailable()) {
    try {
      await pool.query(`DELETE FROM user_completions WHERE LOWER(username) = $1`, [uKey]);
      await pool.query(`DELETE FROM user_lab_solutions WHERE LOWER(username) = $1`, [uKey]);
      return res.json({ success: true });
    } catch (err) {
      console.error('Error resetting user progress:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// -------------------------------------------------------------
// 7. Audit & Activity Logs Endpoints (PostgreSQL activity_logs table)
// -------------------------------------------------------------
app.get('/api/logs', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `SELECT id, username, action_type as "type", title, details, device_os as "deviceOS", TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') as "timestamp"
         FROM activity_logs ORDER BY timestamp DESC LIMIT 200`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error('Error fetching activity logs from PostgreSQL:', err);
    }
  }
  return res.json([]);
});

app.post('/api/logs', async (req, res) => {
  const { username, actionType, type, title, details, deviceOS } = req.body;
  const id = `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const aType = actionType || type || 'GENERAL';
  const uName = username || 'System';
  const logTitle = title || '';
  const logDetails = details || '';
  const logDevice = deviceOS || 'Desktop Web Browser';

  if (getIsPostgresAvailable()) {
    try {
      await pool.query(
        `INSERT INTO activity_logs (id, username, action_type, title, details, device_os)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, uName, aType, logTitle, logDetails, logDevice]
      );
      return res.json({
        success: true,
        log: { id, username: uName, type: aType, title: logTitle, details: logDetails, deviceOS: logDevice, timestamp: new Date().toISOString() }
      });
    } catch (err) {
      console.error('Error inserting activity log:', err);
    }
  }

  return res.json({ success: true });
});

app.delete('/api/logs', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      await pool.query(`DELETE FROM activity_logs`);
      return res.json({ success: true, message: 'Activity logs purged from Cloud SQL.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

app.delete('/api/logs/:id', async (req, res) => {
  const { id } = req.params;
  if (getIsPostgresAvailable()) {
    try {
      await pool.query(`DELETE FROM activity_logs WHERE id = $1`, [id]);
      return res.json({ success: true, message: `Activity log ${id} deleted.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

// -------------------------------------------------------------
// 8. Platform Global Settings & Real-time Heartbeat
// -------------------------------------------------------------
app.get('/api/settings', async (req, res) => {
  const defaultSettings = {
    isLearningPathEnabled: true,
    isTroubleshootingLabsEnabled: true
  };

  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(`SELECT value_json FROM platform_settings WHERE key = 'tabs_visibility'`);
      if (result.rows.length > 0) {
        return res.json({ ...defaultSettings, ...result.rows[0].value_json });
      }
    } catch (err) {
      console.error('Error fetching platform settings:', err);
    }
  }

  return res.json(defaultSettings);
});

app.post('/api/settings', async (req, res) => {
  const settings = req.body;
  if (getIsPostgresAvailable()) {
    try {
      await pool.query(
        `INSERT INTO platform_settings (key, value_json, updated_at)
         VALUES ('tabs_visibility', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()`,
        [JSON.stringify(settings)]
      );
      return res.json({ success: true, settings });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.status(503).json({ error: 'Database unavailable' });
});

app.post('/api/users/heartbeat', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  if (getIsPostgresAvailable()) {
    try {
      await pool.query(
        `UPDATE users SET last_active_at = NOW() WHERE LOWER(username) = LOWER($1)`,
        [username]
      );
      return res.json({ success: true });
    } catch (err) {
      console.error('Heartbeat error:', err);
    }
  }
  return res.json({ success: true });
});

// -------------------------------------------------------------
// 9. User Certificates Endpoints (Cloud SQL & Verification)
// -------------------------------------------------------------
app.get('/api/certificates', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(`
        SELECT c.id, c.username, u.display_name as "displayName", c.topic_id as "topicId",
               c.topic_title as "topicTitle", c.score_percent as "scorePercent",
               c.certificate_code as "certificateCode",
               TO_CHAR(c.issued_at, 'YYYY-MM-DD HH24:MI:SS') as "issuedAt"
        FROM user_certificates c
        LEFT JOIN users u ON LOWER(c.username) = LOWER(u.username)
        ORDER BY c.issued_at DESC
      `);
      return res.json(result.rows);
    } catch (err: any) {
      console.error('Error fetching certificates:', err);
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json([]);
});

app.get('/api/certificates/:username', async (req, res) => {
  const { username } = req.params;
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(`
        SELECT id, username, topic_id as "topicId", topic_title as "topicTitle",
               score_percent as "scorePercent", certificate_code as "certificateCode",
               TO_CHAR(issued_at, 'YYYY-MM-DD HH24:MI:SS') as "issuedAt"
        FROM user_certificates
        WHERE LOWER(username) = LOWER($1)
        ORDER BY issued_at DESC
      `, [username]);
      return res.json(result.rows);
    } catch (err: any) {
      console.error('Error fetching user certificates:', err);
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json([]);
});

app.post('/api/certificates', async (req, res) => {
  const { username, topicId, topicTitle, scorePercent } = req.body;
  if (!username || !topicId) {
    return res.status(400).json({ error: 'Username and topicId are required' });
  }

  const cleanTopic = (topicId || 'MOD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const randomHex = Math.random().toString(36).substr(2, 6).toUpperCase();
  const certCode = `HD-${cleanTopic}-${randomHex}`;
  const certId = `cert_${Date.now()}_${randomHex}`;
  const score = scorePercent !== undefined ? parseInt(scorePercent, 10) : 100;

  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(`
        INSERT INTO user_certificates (id, username, topic_id, topic_title, score_percent, certificate_code, issued_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (username, topic_id) DO UPDATE SET
          score_percent = GREATEST(user_certificates.score_percent, EXCLUDED.score_percent),
          topic_title = EXCLUDED.topic_title
        RETURNING id, username, topic_id as "topicId", topic_title as "topicTitle",
                  score_percent as "scorePercent", certificate_code as "certificateCode",
                  TO_CHAR(issued_at, 'YYYY-MM-DD HH24:MI:SS') as "issuedAt"
      `, [certId, username.trim(), topicId.trim(), topicTitle || topicId, score, certCode]);

      // Log activity
      await pool.query(
        `INSERT INTO activity_logs (id, username, action_type, title, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          username.trim(),
          'CERTIFICATE_EARNED',
          `Earned Certificate for ${topicTitle || topicId}`,
          `Credential Code: ${result.rows[0].certificateCode} | Final Score: ${score}%`
        ]
      ).catch(() => {});

      return res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error('Error issuing certificate in PostgreSQL:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback memory object
  return res.status(201).json({
    id: certId,
    username,
    topicId,
    topicTitle: topicTitle || topicId,
    scorePercent: score,
    certificateCode: certCode,
    issuedAt: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// 10. Real-time Live Visitors & Click Analytics Endpoints
// -------------------------------------------------------------

// Track page visits, heartbeats, and user clicks
app.post('/api/analytics/track', async (req, res) => {
  const {
    sessionId,
    visitorId,
    username,
    eventType = 'PAGE_VIEW',
    targetName = 'Homepage Visit',
    targetPath = '/',
    details = {},
    deviceOS = 'Unknown Device',
    referrer = ''
  } = req.body;

  if (!sessionId || !visitorId) {
    return res.status(400).json({ error: 'sessionId and visitorId are required.' });
  }

  // Extract client IP address safely behind Traefik/GCP Load Balancer
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';

  const isPageView = eventType === 'PAGE_VIEW';
  const isClick = !['PAGE_VIEW', 'HEARTBEAT'].includes(eventType);
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  if (getIsPostgresAvailable()) {
    try {
      // 1. Upsert Visitor Session
      await pool.query(`
        INSERT INTO visitor_sessions (
          id, visitor_id, username, ip_address, user_agent, device_os,
          current_path, referrer, first_seen_at, last_seen_at, total_page_views, total_clicks
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          username = COALESCE(EXCLUDED.username, visitor_sessions.username),
          current_path = EXCLUDED.current_path,
          device_os = EXCLUDED.device_os,
          last_seen_at = NOW(),
          total_page_views = visitor_sessions.total_page_views + (CASE WHEN $11 THEN 1 ELSE 0 END),
          total_clicks = visitor_sessions.total_clicks + (CASE WHEN $12 THEN 1 ELSE 0 END)
      `, [
        sessionId,
        visitorId,
        username || null,
        ipAddress,
        userAgent,
        deviceOS,
        targetPath,
        referrer,
        isPageView ? 1 : 0,
        isClick ? 1 : 0,
        isPageView,
        isClick
      ]);

      // 2. Insert into Analytics Events (skip pure heartbeats to keep DB lean)
      if (eventType !== 'HEARTBEAT') {
        await pool.query(`
          INSERT INTO analytics_events (
            id, session_id, username, event_type, target_name, target_path, details, device_os, ip_address, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `, [
          eventId,
          sessionId,
          username || null,
          eventType,
          targetName,
          targetPath,
          JSON.stringify(details),
          deviceOS,
          ipAddress
        ]);
      }

      // 3. Update user last_active_at if authenticated
      if (username) {
        await pool.query(
          `UPDATE users SET last_active_at = NOW(), last_device_os = $2 WHERE LOWER(username) = LOWER($1)`,
          [username, deviceOS]
        ).catch(() => {});
      }

      return res.json({ success: true, eventId });
    } catch (err: any) {
      console.error('Analytics track error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.json({ success: true, fallback: true });
});

// Retrieve live active visitors, page visits & click stream for Admin Panel
app.get('/api/analytics/live', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      // 1. Live Active Visitors (active within last 3 minutes)
      const activeVisitorsRes = await pool.query(`
        SELECT 
          s.id as "sessionId",
          s.visitor_id as "visitorId",
          s.username,
          COALESCE(u.display_name, s.username, 'Guest Learner') as "displayName",
          COALESCE(u.role, 'Visitor') as "role",
          s.device_os as "deviceOS",
          s.current_path as "currentPath",
          s.ip_address as "ipAddress",
          s.total_page_views as "totalPageViews",
          s.total_clicks as "totalClicks",
          TO_CHAR(s.first_seen_at, 'YYYY-MM-DD HH24:MI:SS') as "firstSeenAt",
          TO_CHAR(s.last_seen_at, 'YYYY-MM-DD HH24:MI:SS') as "lastSeenAt",
          ROUND(EXTRACT(EPOCH FROM (NOW() - s.first_seen_at)) / 60)::INT as "durationMinutes",
          ROUND(EXTRACT(EPOCH FROM (NOW() - s.last_seen_at)))::INT as "secondsSinceLastActive"
        FROM visitor_sessions s
        LEFT JOIN users u ON LOWER(s.username) = LOWER(u.username)
        WHERE s.last_seen_at >= NOW() - INTERVAL '3 minutes'
        ORDER BY s.last_seen_at DESC
      `);

      const activeVisitors = activeVisitorsRes.rows;
      const activeVisitorsCount = activeVisitors.length;

      // 2. Summary Counters (Today vs All-Time)
      const totalsRes = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW' AND created_at >= CURRENT_DATE) as "totalVisitsToday",
          COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW') as "totalVisitsAllTime",
          COUNT(*) FILTER (WHERE event_type != 'PAGE_VIEW' AND event_type != 'HEARTBEAT' AND created_at >= CURRENT_DATE) as "totalClicksToday",
          COUNT(*) FILTER (WHERE event_type != 'PAGE_VIEW' AND event_type != 'HEARTBEAT') as "totalClicksAllTime"
        FROM analytics_events
      `);

      const uniqueVisitorsRes = await pool.query(`
        SELECT COUNT(DISTINCT visitor_id) as "totalUniqueVisitors" FROM visitor_sessions
      `);

      // 3. Top Clicked Modules / Actions
      const topClicksRes = await pool.query(`
        SELECT 
          target_name as "targetName",
          event_type as "eventType",
          COUNT(*) as "clickCount"
        FROM analytics_events
        WHERE event_type != 'PAGE_VIEW' AND event_type != 'HEARTBEAT'
        GROUP BY target_name, event_type
        ORDER BY "clickCount" DESC
        LIMIT 10
      `);

      // 4. Live Click Stream (Latest 35 actions)
      const recentEventsRes = await pool.query(`
        SELECT 
          e.id,
          e.session_id as "sessionId",
          e.username,
          COALESCE(u.display_name, e.username, 'Guest Learner') as "displayName",
          e.event_type as "eventType",
          e.target_name as "targetName",
          e.target_path as "targetPath",
          e.details,
          e.device_os as "deviceOS",
          e.ip_address as "ipAddress",
          TO_CHAR(e.created_at, 'HH24:MI:SS') as "timeAgo",
          TO_CHAR(e.created_at, 'YYYY-MM-DD HH24:MI:SS') as "timestamp"
        FROM analytics_events e
        LEFT JOIN users u ON LOWER(e.username) = LOWER(u.username)
        ORDER BY e.created_at DESC
        LIMIT 35
      `);

      // 5. Device & OS Breakdown
      const deviceRes = await pool.query(`
        SELECT 
          COALESCE(device_os, 'Desktop Web') as "deviceOS",
          COUNT(*) as "count"
        FROM visitor_sessions
        GROUP BY device_os
        ORDER BY "count" DESC
        LIMIT 6
      `);

      // 6. Path Breakdown
      const pathRes = await pool.query(`
        SELECT 
          COALESCE(current_path, '/') as "path",
          COUNT(*) as "visitCount"
        FROM visitor_sessions
        GROUP BY current_path
        ORDER BY "visitCount" DESC
        LIMIT 8
      `);

      const row = totalsRes.rows[0] || {};
      const uniqueRow = uniqueVisitorsRes.rows[0] || {};

      return res.json({
        activeVisitorsCount,
        activeVisitors,
        totalVisitsToday: parseInt(row.totalVisitsToday || '0', 10),
        totalVisitsAllTime: parseInt(row.totalVisitsAllTime || '0', 10),
        totalUniqueVisitors: parseInt(uniqueRow.totalUniqueVisitors || '0', 10),
        totalClicksToday: parseInt(row.totalClicksToday || '0', 10),
        totalClicksAllTime: parseInt(row.totalClicksAllTime || '0', 10),
        topClickedActions: topClicksRes.rows,
        recentClickStream: recentEventsRes.rows,
        deviceBreakdown: deviceRes.rows,
        pathBreakdown: pathRes.rows,
        serverTime: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error fetching live analytics:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback if DB disconnected
  return res.json({
    activeVisitorsCount: 1,
    activeVisitors: [],
    totalVisitsToday: 1,
    totalVisitsAllTime: 1,
    totalUniqueVisitors: 1,
    totalClicksToday: 0,
    totalClicksAllTime: 0,
    topClickedActions: [],
    recentClickStream: [],
    deviceBreakdown: [],
    pathBreakdown: [],
    serverTime: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// 11. Server Boot & Auto Real-Time Sync
// -------------------------------------------------------------
initDatabase().then(async () => {
  await populateRealtimeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Production Backend API running on http://localhost:${PORT}`);
  });
});
