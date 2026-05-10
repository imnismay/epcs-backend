// import express from 'express';
// import multer from 'multer';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import { run, get, all } from '../database.js';

// const router = express.Router();

// // Configure file upload
// const storage = multer.diskStorage({
//   destination: 'uploads/',
//   filename: (req, file, cb) => {
//     cb(null, uuidv4() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// // Public complaint submission
// router.post('/submit', upload.single('attachment'), async (req, res) => {
//   const { name, mobile, institution, department, issueCategory, subCategory, description, priority } = req.body;
//   const attachment = req.file ? req.file.filename : null;

//   if (!name || !mobile || !institution || !department || !issueCategory || !subCategory) {
//     return res.status(400).json({ error: 'All required fields must be filled' });
//   }

//   // 1) Try exact match (institution + department + category + subcategory)
//   let rule = await get(
//     `SELECT staff_id FROM assignment_rules 
//      WHERE institution = ? 
//        AND department = ? 
//        AND issue_category = ? 
//        AND sub_category = ?`,
//     [institution, department, issueCategory, subCategory]
//   );

//   // 2) If no exact match, try without institution (department + category + subcategory)
//   if (!rule) {
//     rule = await get(
//       `SELECT staff_id FROM assignment_rules 
//        WHERE department = ? 
//          AND issue_category = ? 
//          AND sub_category = ?
//        LIMIT 1`,
//       [department, issueCategory, subCategory]
//     );
//     if (rule) {
//       console.log(`No exact institution match for ${institution}, but found rule for ${department}/${issueCategory}/${subCategory}`);
//     }
//   }
  
//   let assignedTo = null;
//   let initialStatus = 'New';
  
//   if (rule && rule.staff_id) {
//     assignedTo = rule.staff_id;
//     initialStatus = 'Assigned';
//   } else {
//     // Fallback to first admin if no rule found at all
//     const admin = await get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
//     assignedTo = admin ? admin.id : null;
//     console.log(`No assignment rule found for ${department}/${issueCategory}/${subCategory}. Assigned to admin.`);
//   }

//   const result = await run(
//     `INSERT INTO complaints 
//      (user_name, mobile, institution, department, issue_category, sub_category, description, priority, attachment, assigned_to, status)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     [name, mobile, institution, department, issueCategory, subCategory, description, priority || 'Medium', attachment, assignedTo, initialStatus]
//   );

//   // Add initial remark
//   const remarkText = assignedTo 
//     ? `Complaint submitted and assigned to staff ID ${assignedTo}` 
//     : 'Complaint submitted (no matching assignment rule)';
//   await run(
//     'INSERT INTO remarks (complaint_id, remark, status_change) VALUES (?, ?, ?)',
//     [result.lastID, remarkText, initialStatus]
//   );

//   res.json({ success: true, complaintId: result.lastID, message: 'Complaint submitted successfully' });
// });

// // Get complaint status tracking (public)
// router.get('/track/:mobile/:complaintId', async (req, res) => {
//   const { mobile, complaintId } = req.params;
//   const complaint = await get(
//     'SELECT * FROM complaints WHERE id = ? AND mobile = ?',
//     [complaintId, mobile]
//   );
//   if (!complaint) {
//     return res.status(404).json({ error: 'Complaint not found' });
//   }
//   const remarks = await all('SELECT * FROM remarks WHERE complaint_id = ? ORDER BY created_at', [complaintId]);
//   res.json({ complaint, remarks });
// });

// export default router;

import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from '../database.js';

const router = express.Router();

// Configure file upload
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Public complaint submission
router.post('/submit', upload.single('attachment'), async (req, res) => {
  try {
    const { name, mobile, institution, department, issueCategory, subCategory, description, priority } = req.body;
    const attachment = req.file ? req.file.filename : null;

    if (!name || !mobile || !institution || !department || !issueCategory || !subCategory) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Find assignment rule
    let rule = await get(
      `SELECT staff_id FROM assignment_rules 
       WHERE institution = ? AND department = ? AND issue_category = ? AND sub_category = ?`,
      [institution, department, issueCategory, subCategory]
    );

    if (!rule) {
      rule = await get(
        `SELECT staff_id FROM assignment_rules 
         WHERE department = ? AND issue_category = ? AND sub_category = ? LIMIT 1`,
        [department, issueCategory, subCategory]
      );
      if (rule) {
        console.log(`No exact institution match for ${institution}, but found rule for ${department}/${issueCategory}/${subCategory}`);
      }
    }
    
    let assignedTo = null;
    let initialStatus = 'New';
    
    if (rule && rule.staff_id) {
      assignedTo = rule.staff_id;
      initialStatus = 'Assigned';
    } else {
      const admin = await get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      assignedTo = admin ? admin.id : null;
      console.log(`No assignment rule found for ${department}/${issueCategory}/${subCategory}. Assigned to admin.`);
    }

    // ✅ NOW INCLUDES attachment column (since you added it to the database)
    const result = await run(
      `INSERT INTO complaints 
       (user_name, mobile, institution, department, issue_category, sub_category, description, priority, attachment, assigned_to, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, mobile, institution, department, issueCategory, subCategory, description, priority || 'Medium', attachment, assignedTo, initialStatus]
    );

    // Add initial remark
    const remarkText = assignedTo 
      ? `Complaint submitted and assigned to staff ID ${assignedTo}` 
      : 'Complaint submitted (no matching assignment rule)';
    
    await run(
      'INSERT INTO remarks (complaint_id, remark, status_change) VALUES (?, ?, ?)',
      [result.lastID, remarkText, initialStatus]
    );

    res.json({ 
      success: true, 
      complaintId: result.lastID, 
      message: 'Complaint submitted successfully' 
    });
    
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ error: 'Failed to submit complaint: ' + error.message });
  }
});

// Get complaint status tracking (public)
router.get('/track/:mobile/:complaintId', async (req, res) => {
  try {
    const { mobile, complaintId } = req.params;
    const complaint = await get(
      'SELECT * FROM complaints WHERE id = ? AND mobile = ?',
      [complaintId, mobile]
    );
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    const remarks = await all('SELECT * FROM remarks WHERE complaint_id = ? ORDER BY created_at', [complaintId]);
    res.json({ complaint, remarks });
  } catch (error) {
    console.error('Error tracking complaint:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

export default router;
