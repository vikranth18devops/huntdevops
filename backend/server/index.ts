import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDatabase, getIsPostgresAvailable } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-Memory Fallback Stores if DB is initializing
let inMemoryUsers: any[] = [];
let inMemoryTopics: any[] = [];
let inMemoryCompletions: Record<string, string[]> = {};
let inMemorySolved: Record<string, string[]> = {};
let inMemoryLogs: any[] = [];

// -------------------------------------------------------------
// 1. Healthcheck Endpoint
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: getIsPostgresAvailable() ? 'PostgreSQL (Connected)' : 'Fallback Dynamic Store',
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
    phone: phone ? phone.trim() : undefined,
    password: password,
    role: role || 'Learner',
    experienceLevel: experienceLevel || 'Beginner',
    status: 'Active',
    lastDeviceOS: lastDeviceOS || 'MacBook / macOS',
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
        [userObj.id, userObj.username, userObj.displayName, userObj.email, userObj.password, userObj.role, userObj.experienceLevel, userObj.status, userObj.lastDeviceOS, userObj.phone || null]
      );

      // Record activity log in PostgreSQL
      await pool.query(
        `INSERT INTO activity_logs (id, username, action_type, title, details, device_os)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `log_${Date.now()}`,
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
      console.error(err);
    }
  }

  // Fallback Store
  const existing = inMemoryUsers.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Username or email already registered.' });
  }
  inMemoryUsers.unshift(userObj);
  return res.status(201).json({ user: userObj, token: `jwt_${userObj.id}` });
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
          const device = lastDeviceOS || u.lastDeviceOS || 'MacBook / macOS';
          await pool.query(
            `INSERT INTO activity_logs (id, username, action_type, title, details, device_os)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [`log_${Date.now()}`, u.username, 'USER_LOGIN', `User Signed In: @${u.username}`, `Device: ${device}`, device]
          ).catch(() => {});

          return res.json({ user: u, token: `jwt_${u.id}` });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  const u = inMemoryUsers.find(x => (x.username.toLowerCase() === username.toLowerCase() || x.email.toLowerCase() === username.toLowerCase()) && x.password === password);
  if (u) {
    return res.json({ user: u, token: `jwt_${u.id}` });
  }

  return res.status(401).json({ error: 'Invalid credentials.' });
});

// -------------------------------------------------------------
// 3. User Management Endpoints (Admin Portal & Level Updates)
// -------------------------------------------------------------
app.get('/api/users', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `SELECT id, username, display_name as "displayName", email, phone, role, experience_level as "experienceLevel", status, last_device_os as "lastDeviceOS", TO_CHAR(created_at, 'YYYY-MM-DD') as "createdAt"
         FROM users ORDER BY created_at DESC`
      );
      if (result.rows.length > 0) {
        return res.json(result.rows);
      }
    } catch (err) {
      console.error(err);
    }
  }
  return res.json(inMemoryUsers);
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
  const uDevice = lastDeviceOS || 'MacBook / macOS';

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
      console.error(err);
    }
  }

  return res.json({ success: true });
});

// Logs Endpoint for Activity Tracking
app.get('/api/logs', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `SELECT id, username, action_type as "actionType", title, details, device_os as "deviceOS", TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') as "timestamp"
         FROM activity_logs ORDER BY timestamp DESC LIMIT 150`
      );
      return res.json(result.rows);
    } catch (err) {
      console.error(err);
    }
  }
  return res.json(inMemoryLogs);
});

app.post('/api/logs', async (req, res) => {
  const { username, actionType, title, details, deviceOS } = req.body;
  const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const logObj = { id, username: username || 'System', actionType: actionType || 'GENERAL', title: title || '', details: details || '', deviceOS: deviceOS || 'MacBook / macOS', timestamp: new Date().toISOString() };

  if (getIsPostgresAvailable()) {
    try {
      await pool.query(
        `INSERT INTO activity_logs (id, username, action_type, title, details, device_os)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, logObj.username, logObj.actionType, logObj.title, logObj.details, logObj.deviceOS]
      );
      return res.json({ success: true, log: logObj });
    } catch (err) {
      console.error(err);
    }
  }

  inMemoryLogs.unshift(logObj);
  return res.json({ success: true, log: logObj });
});


// PUT /api/users/:userId/experience-level - UPDATE DEVOPS EXPERIENCE LEVEL
app.put('/api/users/:userId/experience-level', async (req, res) => {
  const { userId } = req.params;
  const { experienceLevel } = req.body;

  if (!['Beginner', 'Intermediate', 'Advanced'].includes(experienceLevel)) {
    return res.status(400).json({ error: 'Invalid experience level.' });
  }

  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `UPDATE users SET experience_level = $1 WHERE id = $2 OR username = $2
         RETURNING id, username, display_name as "displayName", email, role, experience_level as "experienceLevel", status`,
        [experienceLevel, userId]
      );
      if (result.rows.length > 0) {
        return res.json({ success: true, user: result.rows[0] });
      }
    } catch (err) {
      console.error(err);
    }
  }

  const u = inMemoryUsers.find(x => x.id === userId || x.username === userId);
  if (u) {
    u.experienceLevel = experienceLevel;
    return res.json({ success: true, user: u });
  }

  return res.status(404).json({ error: 'User not found.' });
});

// PUT /api/users/:userId/status - SUSPEND / ACTIVATE
app.put('/api/users/:userId/status', async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(
        `UPDATE users SET status = $1 WHERE id = $2 RETURNING id, username, status`,
        [status, userId]
      );
      return res.json({ success: true, user: result.rows[0] });
    } catch (err) {
      console.error(err);
    }
  }

  const u = inMemoryUsers.find(x => x.id === userId);
  if (u) {
    u.status = status;
    return res.json({ success: true, user: u });
  }

  return res.status(404).json({ error: 'User not found.' });
});

// -------------------------------------------------------------
// 4. Curriculum Topics & CMS Endpoints
// -------------------------------------------------------------
app.get('/api/topics', async (req, res) => {
  if (getIsPostgresAvailable()) {
    try {
      const result = await pool.query(`SELECT data_json FROM topics ORDER BY id ASC`);
      if (result.rows.length > 0) {
        return res.json(result.rows.map(r => r.data_json));
      }
    } catch (err) {
      console.error(err);
    }
  }
  return res.json(inMemoryTopics);
});

app.post('/api/topics', async (req, res) => {
  const { topics } = req.body;
  if (!Array.isArray(topics)) {
    return res.status(400).json({ error: 'Topics payload must be an array.' });
  }

  if (getIsPostgresAvailable()) {
    try {
      for (const t of topics) {
        await pool.query(
          `INSERT INTO topics (id, title, subtitle, data_json, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (id) DO UPDATE SET data_json = EXCLUDED.data_json, updated_at = NOW()`,
          [t.id, t.title, t.subtitle || '', JSON.stringify(t)]
        );
      }
      return res.json({ success: true, message: 'Topics saved to PostgreSQL.' });
    } catch (err) {
      console.error(err);
    }
  }

  inMemoryTopics = topics;
  return res.json({ success: true, message: 'Topics updated.' });
});

// -------------------------------------------------------------
// 5. User Progress & Completions Endpoints
// -------------------------------------------------------------
app.get('/api/progress/:username', async (req, res) => {
  const { username } = req.params;
  const uKey = username.toLowerCase();

  if (getIsPostgresAvailable()) {
    try {
      const compRes = await pool.query(`SELECT question_id FROM user_completions WHERE LOWER(username) = $1`, [uKey]);
      const solvedRes = await pool.query(`SELECT lab_id FROM user_lab_solutions WHERE LOWER(username) = $1`, [uKey]);

      return res.json({
        completedQuestionIds: compRes.rows.map(r => r.question_id),
        solvedLabIds: solvedRes.rows.map(r => r.lab_id)
      });
    } catch (err) {
      console.error(err);
    }
  }

  return res.json({
    completedQuestionIds: inMemoryCompletions[uKey] || [],
    solvedLabIds: inMemorySolved[uKey] || []
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
      console.error(err);
    }
  }

  if (!inMemoryCompletions[uKey]) inMemoryCompletions[uKey] = [];
  if (!inMemoryCompletions[uKey].includes(questionId)) {
    inMemoryCompletions[uKey].push(questionId);
  }
  return res.json({ success: true });
});

// Initialize DB and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Production Backend API running on http://localhost:${PORT}`);
  });
});
