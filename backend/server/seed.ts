import { pool, initDatabase } from './db';

const DEFAULT_USERS = [
  {
    id: 'usr_001',
    username: 'admin',
    displayName: 'Super Admin',
    email: 'admin@huntdevops.io',
    password: 'admin123',
    role: 'Admin',
    experienceLevel: 'Advanced',
    status: 'Active',
    lastDeviceOS: 'MacBook / macOS'
  },
  {
    id: 'usr_002',
    username: 'alex_sre',
    displayName: 'Alex Morgan',
    email: 'alex.m@cloudcorp.com',
    password: 'devops2026',
    role: 'DevOps Lead',
    experienceLevel: 'Advanced',
    status: 'Active',
    lastDeviceOS: 'Linux Ubuntu'
  },
  {
    id: 'usr_003',
    username: 'priya_k8s',
    displayName: 'Priya Sharma',
    email: 'priya@techscale.io',
    password: 'cloud2026',
    role: 'SRE Pro',
    experienceLevel: 'Intermediate',
    status: 'Active',
    lastDeviceOS: 'Windows Workstation'
  },
  {
    id: 'usr_004',
    username: 'david_kim',
    displayName: 'David Kim',
    email: 'dkim@startuplab.dev',
    password: 'learner123',
    role: 'Learner',
    experienceLevel: 'Beginner',
    status: 'Active',
    lastDeviceOS: 'MacBook Air'
  }
];

export async function seedDatabase() {
  await initDatabase();

  console.log('🌱 Seeding PostgreSQL database with default data...');

  for (const u of DEFAULT_USERS) {
    await pool.query(
      `INSERT INTO users (id, username, display_name, email, password_hash, role, experience_level, status, last_device_os)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (username) DO UPDATE
       SET experience_level = EXCLUDED.experience_level, role = EXCLUDED.role, display_name = EXCLUDED.display_name`,
      [u.id, u.username, u.displayName, u.email, u.password, u.role, u.experienceLevel, u.status, u.lastDeviceOS]
    );
  }

  console.log('✅ PostgreSQL database successfully seeded with initial users and experience levels!');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
