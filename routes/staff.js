import express from 'express';
import { authenticateToken, requireStaff } from '../middleware/auth.js';
import { run, get, all } from '../database.js';

const router = express.Router();
router.use(authenticateToken);
router.use(requireStaff);

// ✅ NEW: Get current logged-in staff info (for debugging)
router.get('/me', (req, res) => {
  res.json({ 
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Get assigned complaints
router.get('/complaints', async (req, res) => {
  // Optional: log the staff ID for debugging
  console.log(`Staff ${req.user.id} (${req.user.name}) is fetching assigned complaints`);
  
  const complaints = await all(
    'SELECT * FROM complaints WHERE assigned_to = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  
  console.log(`Found ${complaints.length} complaints`);
  res.json(complaints);
});

// Update complaint status
router.patch('/complaints/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, remark } = req.body;
  
  // Optional: verify the complaint belongs to this staff before updating
  const complaint = await get('SELECT assigned_to FROM complaints WHERE id = ?', [id]);
  if (!complaint || complaint.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to update this complaint' });
  }
  
  await run(
    'UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id]
  );
  
  await run(
    'INSERT INTO remarks (complaint_id, remark, status_change, created_by) VALUES (?, ?, ?, ?)',
    [id, remark || `Status changed to ${status}`, status, req.user.id]
  );
  
  res.json({ success: true });
});

// Add remark
router.post('/complaints/:id/remarks', async (req, res) => {
  const { id } = req.params;
  const { remark } = req.body;
  
  // Verify authorization
  const complaint = await get('SELECT assigned_to FROM complaints WHERE id = ?', [id]);
  if (!complaint || complaint.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to add remark' });
  }
  
  await run(
    'INSERT INTO remarks (complaint_id, remark, created_by) VALUES (?, ?, ?)',
    [id, remark, req.user.id]
  );
  
  res.json({ success: true });
});

// Get complaint details with remarks
router.get('/complaints/:id', async (req, res) => {
  const complaint = await get('SELECT * FROM complaints WHERE id = ?', [req.params.id]);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  
  // Staff can only view their own complaints
  if (complaint.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to view this complaint' });
  }
  
  const remarks = await all('SELECT * FROM remarks WHERE complaint_id = ? ORDER BY created_at', [req.params.id]);
  res.json({ complaint, remarks });
});

export default router;