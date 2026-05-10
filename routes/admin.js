import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { run, get, all } from '../database.js';
import { Parser } from 'json2csv';

const router = express.Router();
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', async (req, res) => {
  const total = await get('SELECT COUNT(*) as count FROM complaints');
  const completed = await get("SELECT COUNT(*) as count FROM complaints WHERE status = 'Completed'");
  const pending = await get("SELECT COUNT(*) as count FROM complaints WHERE status IN ('New', 'Assigned', 'In Progress')");
  
  const byStatus = await all('SELECT status, COUNT(*) as count FROM complaints GROUP BY status');
  const byInstitution = await all('SELECT institution, COUNT(*) as count FROM complaints GROUP BY institution');
  const byDepartment = await all('SELECT department, COUNT(*) as count FROM complaints GROUP BY department');
  
  const today = new Date().toISOString().split('T')[0];
  const todayCount = await get(
    "SELECT COUNT(*) as count FROM complaints WHERE DATE(created_at) = ?",
    [today]
  );
  
  // ✅ FIXED: MySQL/TiDB compatible date functions
  const weekly = await get(
    "SELECT COUNT(*) as count FROM complaints WHERE created_at >= NOW() - INTERVAL 7 DAY"
  );
  
  const monthly = await get(
    "SELECT COUNT(*) as count FROM complaints WHERE created_at >= NOW() - INTERVAL 30 DAY"
  );

  res.json({
    total: total.count,
    completed: completed.count,
    pending: pending.count,
    today: todayCount.count,
    weekly: weekly.count,
    monthly: monthly.count,
    byStatus,
    byInstitution,
    byDepartment
  });
});

// Get all complaints with filters
router.get('/complaints', async (req, res) => {
  const { status, institution, department, staff, startDate, endDate } = req.query;
  let query = `
    SELECT c.*, u.name as assigned_staff_name 
    FROM complaints c
    LEFT JOIN users u ON c.assigned_to = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) { query += ' AND c.status = ?'; params.push(status); }
  if (institution) { query += ' AND c.institution = ?'; params.push(institution); }
  if (department) { query += ' AND c.department = ?'; params.push(department); }
  if (staff) { query += ' AND c.assigned_to = ?'; params.push(staff); }
  if (startDate) { query += ' AND DATE(c.created_at) >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND DATE(c.created_at) <= ?'; params.push(endDate); }
  
  query += ' ORDER BY c.created_at DESC';
  
  const complaints = await all(query, params);
  res.json(complaints);
});

// Export to CSV
router.get('/export', async (req, res) => {
  const complaints = await all(`
    SELECT c.id, c.user_name, c.mobile, c.institution, c.department, 
           c.issue_category, c.sub_category, c.status, c.priority, c.created_at,
           u.name as assigned_staff
    FROM complaints c
    LEFT JOIN users u ON c.assigned_to = u.id
    ORDER BY c.created_at DESC
  `);
  
  const parser = new Parser();
  const csv = parser.parse(complaints);
  res.header('Content-Type', 'text/csv');
  res.attachment('complaints_export.csv');
  res.send(csv);
});

// Manage staff users
router.get('/users', async (req, res) => {
  const users = await all("SELECT id, name, email, role, mobile, department, created_at FROM users");
  res.json(users);
});

router.post('/users', async (req, res) => {
  const { name, email, password, role, mobile, department } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await run(
    'INSERT INTO users (name, email, password, role, mobile, department) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, hashedPassword, role, mobile, department]
  );
  res.json({ success: true });
});

router.put('/users/:id', async (req, res) => {
  const { name, email, role, mobile, department } = req.body;
  await run(
    'UPDATE users SET name = ?, email = ?, role = ?, mobile = ?, department = ? WHERE id = ?',
    [name, email, role, mobile, department, req.params.id]
  );
  res.json({ success: true });
});

router.delete('/users/:id', async (req, res) => {
  await run('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Assignment rules
router.get('/assignment-rules', async (req, res) => {
  const rules = await all(`
    SELECT ar.*, u.name as staff_name 
    FROM assignment_rules ar
    JOIN users u ON ar.staff_id = u.id
  `);
  res.json(rules);
});

router.post('/assignment-rules', async (req, res) => {
  const { institution, department, staff_id } = req.body;
  await run(
    'INSERT INTO assignment_rules (institution, department, staff_id) VALUES (?, ?, ?)',
    [institution, department, staff_id]
  );
  res.json({ success: true });
});

router.delete('/assignment-rules/:id', async (req, res) => {
  await run('DELETE FROM assignment_rules WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// Get staff list for assignment
router.get('/staff-list', async (req, res) => {
  const staff = await all("SELECT id, name, department FROM users WHERE role = 'staff'");
  res.json(staff);
});

// Institutions list
router.get('/institutions', async (req, res) => {
  const institutions = await all('SELECT DISTINCT institution FROM complaints UNION SELECT "East Point College of Engineering" as institution UNION SELECT "East Point College of Pharmacy" UNION SELECT "East Point School"');
  res.json(institutions);
});

export default router;
