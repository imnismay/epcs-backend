// import sqlite3 from 'sqlite3';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import bcrypt from 'bcryptjs';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const dbPath = path.join(__dirname, 'complaints.db');

// export const db = new sqlite3.Database(dbPath);

// // Helper for promises
// export function run(query, params = []) {
//   return new Promise((resolve, reject) => {
//     db.run(query, params, function(err) {
//       if (err) reject(err);
//       else resolve({ lastID: this.lastID, changes: this.changes });
//     });
//   });
// }

// export function get(query, params = []) {
//   return new Promise((resolve, reject) => {
//     db.get(query, params, (err, row) => {
//       if (err) reject(err);
//       else resolve(row);
//     });
//   });
// }

// export function all(query, params = []) {
//   return new Promise((resolve, reject) => {
//     db.all(query, params, (err, rows) => {
//       if (err) reject(err);
//       else resolve(rows);
//     });
//   });
// }

// export async function initDatabase() {
//   // Create tables
//   await run(`
//     CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT NOT NULL,
//       email TEXT UNIQUE NOT NULL,
//       password TEXT NOT NULL,
//       role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
//       mobile TEXT,
//       department TEXT,
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//     )
//   `);

//   await run(`
//     CREATE TABLE IF NOT EXISTS departments (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT UNIQUE NOT NULL
//     )
//   `);

//   await run(`
//     CREATE TABLE IF NOT EXISTS issue_categories (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       department_id INTEGER NOT NULL,
//       name TEXT NOT NULL,
//       FOREIGN KEY (department_id) REFERENCES departments(id)
//     )
//   `);

//   await run(`
//     CREATE TABLE IF NOT EXISTS sub_categories (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       category_id INTEGER NOT NULL,
//       name TEXT NOT NULL,
//       FOREIGN KEY (category_id) REFERENCES issue_categories(id)
//     )
//   `);

//   await run(`
//     CREATE TABLE IF NOT EXISTS complaints (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       user_name TEXT NOT NULL,
//       mobile TEXT NOT NULL,
//       institution TEXT NOT NULL,
//       department TEXT NOT NULL,
//       issue_category TEXT NOT NULL,
//       sub_category TEXT NOT NULL,
//       description TEXT,
//       priority TEXT DEFAULT 'Medium',
//       attachment TEXT,
//       status TEXT DEFAULT 'New',
//       assigned_to INTEGER,
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY (assigned_to) REFERENCES users(id)
//     )
//   `);

//   await run(`
//     CREATE TABLE IF NOT EXISTS remarks (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       complaint_id INTEGER NOT NULL,
//       remark TEXT NOT NULL,
//       status_change TEXT,
//       created_by INTEGER,
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY (complaint_id) REFERENCES complaints(id),
//       FOREIGN KEY (created_by) REFERENCES users(id)
//     )
//   `);

//   // Institutions table (for dropdowns)
//   await run(`
//     CREATE TABLE IF NOT EXISTS institutions (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT UNIQUE NOT NULL
//     )
//   `);

//   // Updated assignment_rules table with granular fields
//   await run(`
//     DROP TABLE IF EXISTS assignment_rules
//   `);
//   await run(`
//     CREATE TABLE assignment_rules (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       institution TEXT NOT NULL,
//       department TEXT NOT NULL,
//       issue_category TEXT NOT NULL,
//       sub_category TEXT NOT NULL,
//       staff_id INTEGER NOT NULL,
//       FOREIGN KEY (staff_id) REFERENCES users(id),
//       UNIQUE(institution, department, issue_category, sub_category)
//     )
//   `);

//   // Seed master data
//   await seedInstitutions();       // <-- NEW: seed all institutes
//   await seedCategories();         // departments, categories, sub‑categories
//   await seedAssignmentRules();    // staff + assignment rules

//   // Create default admin if not exists
//   const admin = await get('SELECT * FROM users WHERE email = ?', ['admin@eastpoint.edu']);
//   if (!admin) {
//     const hashedPassword = await bcrypt.hash('admin123', 10);
//     await run(
//       'INSERT INTO users (name, email, password, role, mobile) VALUES (?, ?, ?, ?, ?)',
//       ['Administrator', 'admin@eastpoint.edu', hashedPassword, 'admin', '9999999999']
//     );
//     console.log('Default admin created: admin@eastpoint.edu / admin123');
//   }
// }

// async function seedInstitutions() {
//   // All distinct institutions from both Excel sheets
//   const institutionsList = [
//     'East Point College of Medical Sciences & Research Centre (EPCMSR)',
//     'East Point Medical College Hospital (EPH)',
//     'East Point College of Engineering & Technology (EPCET)',
//     'East Point College of Pharmacy (EPCP)',
//     'East Point College of Higher Education (EPCHE)',
//     'East Point College of Management (EPCM)',
//     'East Point College of Nursing (EPCN)',
//     'East Point School of Nursing (EPSN)',
//     'New Royal College of Nursing (NRCN)',
//     'East Point College of Physiotherapy (EPCPT)',
//     'East Point Allied Health Sciences (EPAHS)'
//   ];

//   for (const name of institutionsList) {
//     await run('INSERT OR IGNORE INTO institutions (name) VALUES (?)', [name]);
//   }
//   console.log(`Seeded ${institutionsList.length} institutions.`);
// }

// async function seedCategories() {
//   const departments = [
//     'IT Department', 'Electrical', 'General Maintenance', 'Plumbing', 'Civil / Infrastructure', 'Security'
//   ];

//   const categoriesData = {
//     'IT Department': {
//       'Hardware Issues': ['Desktop/Laptop not working', 'System not powering on', 'Keyboard/Mouse faulty', 'Printer not working', 'Scanner issues'],
//       'Software Issues': ['Application not opening', 'HIS/ERP issues', 'Login problems', 'Software crash', 'License expired'],
//       'Network Issues': ['No internet', 'Slow internet', 'WiFi not working', 'LAN port issue'],
//       'Access & Credentials': ['Password reset', 'New user creation', 'Access denied'],
//       'Email & Communication': ['Email not working', 'Outlook configuration', 'Spam issues'],
//       'Peripheral Devices': ['Barcode scanner', 'Biometric device', 'Webcam issues'],
//       'Others': ['Data backup request', 'System upgrade', 'Antivirus issues']
//     },
//     'Electrical': {
//       'Power Supply': ['Power failure', 'Generator not working', 'UPS not working'],
//       'Lighting': ['Light not working', 'Flickering light', 'Emergency light failure'],
//       'Switches & Sockets': ['Switch not working', 'Socket not working', 'Loose connection'],
//       'Others': ['Others']
//     },
//     'General Maintenance': {
//       'Furniture': ['Furniture damage', 'Broken chair/table', 'Cupboard issue'],
//       'Doors & Windows': ['Door not closing/opening', 'Window damage', 'Hinges issue'],
//       'Locks & Fixtures': ['Lock not working', 'Key missing', 'Latch issue'],
//       'Minor Repairs': ['Small repair required', 'Nail/fixture issue', 'General wear and tear'],
//       'Others': ['Others']
//     },
//     'Plumbing': {
//       'Water Supply': ['No water supply', 'Low water pressure', 'Irregular supply'],
//       'Leakage': ['Water leakage', 'Pipe leakage', 'Tank overflow'],
//       'Sanitary Fixtures': ['Tap not working', 'Toilet flush not working', 'Washbasin issue'],
//       'Drainage': ['Drain blockage', 'Slow drainage', 'Sewage issue'],
//       'Others': ['Others']
//     },
//     'Civil / Infrastructure': {
//       'Structural Issues': ['Wall cracks', 'Structural damage'],
//       'Ceiling': ['Ceiling damage', 'Water seepage', 'False ceiling issue'],
//       'Flooring': ['Floor tile damage', 'Uneven flooring', 'Broken tiles'],
//       'Painting & Finishing': ['Painting required', 'Paint peeling', 'Surface damage'],
//       'Others': ['Others']
//     },
//     'Security': {
//       'CCTV /Security Staff': [
//         'Surveillance (CCTV)',
//         'CCTV not working',
//         'Camera not recording',
//         'Visibility issue',
//         'Security Staff',
//         'Staff not available',
//         'Misconduct issue'
//       ],
//       'Others': ['Others']
//     }
//   };

//   for (const deptName of departments) {
//     let dept = await get('SELECT id FROM departments WHERE name = ?', [deptName]);
//     if (!dept) {
//       const result = await run('INSERT INTO departments (name) VALUES (?)', [deptName]);
//       dept = { id: result.lastID };
//     }

//     if (deptName === 'Security') {
//       await run(`
//         DELETE FROM sub_categories
//         WHERE category_id IN (SELECT id FROM issue_categories WHERE department_id = ?)
//       `, [dept.id]);
//       await run('DELETE FROM issue_categories WHERE department_id = ?', [dept.id]);
//     }

//     const categories = categoriesData[deptName];
//     for (const [catName, subCats] of Object.entries(categories)) {
//       let category = null;
//       if (deptName !== 'Security') {
//         category = await get('SELECT id FROM issue_categories WHERE department_id = ? AND name = ?', [dept.id, catName]);
//       }
//       if (!category) {
//         const result = await run('INSERT INTO issue_categories (department_id, name) VALUES (?, ?)', [dept.id, catName]);
//         category = { id: result.lastID };
//       }

//       for (const subCat of subCats) {
//         if (deptName !== 'Security') {
//           const existing = await get('SELECT id FROM sub_categories WHERE category_id = ? AND name = ?', [category.id, subCat]);
//           if (existing) continue;
//         }
//         await run('INSERT INTO sub_categories (category_id, name) VALUES (?, ?)', [category.id, subCat]);
//       }
//     }
//   }
// }

// async function seedAssignmentRules() {
//   // Staff names extracted from Excel
//   const staffNames = [
//     'Mr Devraj', 'Mr Basil', 'Mr Senthil Kumar', 'Mr Vinod', 'Mr Sathish',
//     'Mr Manjunath', 'Mr Anand', 'Mr Vinod Kumar', 'Ramesh Gowda', 'Manjunath K',
//     'Praveen Kumar', 'Naveen Shetty', 'Darshan Rao', 'Suresh Babu', 'Vinay Kumar',
//     'Kiran Raj', 'Lokesh M', 'Harish Nayak', 'Sunil Reddy', 'Mahesh Hegde',
//     'Dinesh Kumar', 'Santosh Poojary', 'Venkatesh Murthy', 'Shashank Rao', 'Jagadish Gowda',
//     'Nithin Shekar', 'Ravi Shankar', 'Chandrashekar Bhat'
//   ];

//   // Create staff users if they don't exist
//   for (const name of staffNames) {
//     const existing = await get('SELECT id FROM users WHERE name = ? AND role = ?', [name, 'staff']);
//     if (!existing) {
//       const email = name.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@staff.eastpoint.edu';
//       const hashedPassword = await bcrypt.hash('staff123', 10);
//       await run(
//         'INSERT INTO users (name, email, password, role, mobile) VALUES (?, ?, ?, ?, ?)',
//         [name, email, hashedPassword, 'staff', '']
//       );
//       console.log(`Created staff user: ${name} (${email})`);
//     }
//   }

//   // Assignment entries as extracted from the Excel sheet (non‑empty assigned person)
//   const assignmentEntries = [
//     // IT Department
//     ['IT Department', 'Hardware Issues', 'Desktop/Laptop not working', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Mr Devraj'],
//     ['IT Department', 'Hardware Issues', 'System not powering on', 'East Point Medical College Hospital (EPH)', 'Mr Basil'],
//     ['IT Department', 'Hardware Issues', 'Keyboard/Mouse faulty', 'East Point College of Engineering & Technology (EPCET)', 'Mr Senthil Kumar'],
//     ['IT Department', 'Hardware Issues', 'Printer not working', 'East Point College of Pharmacy (EPCP)', 'Mr Vinod'],
//     ['IT Department', 'Hardware Issues', 'Scanner issues', 'East Point College of Higher Education (EPCHE)', 'Mr Sathish'],
//     ['IT Department', 'Software Issues', 'Application not opening', 'East Point College of Management (EPCM)', 'Mr Manjunath'],
//     ['IT Department', 'Software Issues', 'HIS/ERP issues', 'East Point College of Nursing (EPCN)', 'Mr Anand'],
//     ['IT Department', 'Software Issues', 'Login problems', 'East Point School of Nursing (EPSN)', 'Mr Anand'],
//     ['IT Department', 'Software Issues', 'Software crash', 'New Royal College of Nursing (NRCN)', 'Mr Vinod Kumar'],
//     ['IT Department', 'Software Issues', 'License expired', 'East Point College of Physiotherapy (EPCPT)', 'Mr Vinod Kumar'],
//     ['IT Department', 'Network Issues', 'No internet', 'East Point Allied Health Sciences (EPAHS)', 'Mr Vinod Kumar'],
//     // Electrical
//     ['Electrical', 'Power Supply', 'Power failure', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Ramesh Gowda'],
//     ['Electrical', 'Power Supply', 'Generator not working', 'East Point Medical College Hospital (EPH)', 'Manjunath K'],
//     ['Electrical', 'Power Supply', 'UPS not working', 'East Point College of Engineering & Technology (EPCET)', 'Praveen Kumar'],
//     ['Electrical', 'Lighting', 'Light not working', 'East Point College of Pharmacy (EPCP)', 'Naveen Shetty'],
//     ['Electrical', 'Lighting', 'Flickering light', 'East Point College of Higher Education (EPCHE)', 'Darshan Rao'],
//     ['Electrical', 'Lighting', 'Emergency light failure', 'East Point College of Management (EPCM)', 'Suresh Babu'],
//     ['Electrical', 'Switches & Sockets', 'Switch not working', 'East Point College of Nursing (EPCN)', 'Vinay Kumar'],
//     ['Electrical', 'Switches & Sockets', 'Socket not working', 'East Point School of Nursing (EPSN)', 'Kiran Raj'],
//     ['Electrical', 'Switches & Sockets', 'Loose connection', 'New Royal College of Nursing (NRCN)', 'Lokesh M'],
//     ['Electrical', 'Others', 'Others', 'East Point College of Physiotherapy (EPCPT)', 'Harish Nayak'],
//     ['Electrical', 'Others', 'Others', 'East Point Allied Health Sciences (EPAHS)', 'Sunil Reddy'],
//     // Plumbing
//     ['Plumbing', 'Water Supply', 'No water supply', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Mahesh Hegde'],
//     ['Plumbing', 'Water Supply', 'Low water pressure', 'East Point Medical College Hospital (EPH)', 'Dinesh Kumar'],
//     ['Plumbing', 'Water Supply', 'Irregular supply', 'East Point College of Engineering & Technology (EPCET)', 'Santosh Poojary'],
//     ['Plumbing', 'Leakage', 'Water leakage', 'East Point College of Pharmacy (EPCP)', 'Venkatesh Murthy'],
//     ['Plumbing', 'Leakage', 'Pipe leakage', 'East Point College of Higher Education (EPCHE)', 'Shashank Rao'],
//     ['Plumbing', 'Leakage', 'Tank overflow', 'East Point College of Management (EPCM)', 'Jagadish Gowda'],
//     ['Plumbing', 'Sanitary Fixtures', 'Tap not working', 'East Point College of Nursing (EPCN)', 'Nithin Shekar'],
//     ['Plumbing', 'Sanitary Fixtures', 'Toilet flush not working', 'East Point School of Nursing (EPSN)', 'Ravi Shankar'],
//     ['Plumbing', 'Sanitary Fixtures', 'Washbasin issue', 'New Royal College of Nursing (NRCN)', 'Chandrashekar Bhat'],
//     ['Plumbing', 'Drainage', 'Drain blockage', 'East Point College of Physiotherapy (EPCPT)', 'Mahesh Hegde'],
//     ['Plumbing', 'Drainage', 'Slow drainage', 'East Point Allied Health Sciences (EPAHS)', 'Dinesh Kumar'],
//     // Civil / Infrastructure
//     ['Civil / Infrastructure', 'Structural Issues', 'Wall cracks', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Ramesh Gowda'],
//     ['Civil / Infrastructure', 'Structural Issues', 'Structural damage', 'East Point Medical College Hospital (EPH)', 'Manjunath K'],
//     ['Civil / Infrastructure', 'Ceiling', 'Ceiling damage', 'East Point College of Engineering & Technology (EPCET)', 'Praveen Kumar'],
//     ['Civil / Infrastructure', 'Ceiling', 'Water seepage', 'East Point College of Pharmacy (EPCP)', 'Naveen Shetty'],
//     ['Civil / Infrastructure', 'Ceiling', 'False ceiling issue', 'East Point College of Higher Education (EPCHE)', 'Darshan Rao'],
//     ['Civil / Infrastructure', 'Flooring', 'Floor tile damage', 'East Point College of Management (EPCM)', 'Suresh Babu'],
//     ['Civil / Infrastructure', 'Flooring', 'Uneven flooring', 'East Point College of Nursing (EPCN)', 'Vinay Kumar'],
//     ['Civil / Infrastructure', 'Flooring', 'Broken tiles', 'East Point School of Nursing (EPSN)', 'Kiran Raj'],
//     ['Civil / Infrastructure', 'Painting & Finishing', 'Painting required', 'New Royal College of Nursing (NRCN)', 'Lokesh M'],
//     ['Civil / Infrastructure', 'Painting & Finishing', 'Paint peeling', 'East Point College of Physiotherapy (EPCPT)', 'Harish Nayak'],
//     ['Civil / Infrastructure', 'Painting & Finishing', 'Surface damage', 'East Point Allied Health Sciences (EPAHS)', 'Sunil Reddy'],
//     // Security
//     ['Security', 'CCTV /Security Staff', 'Surveillance (CCTV)', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Suresh Babu'],
//     ['Security', 'CCTV /Security Staff', 'CCTV not working', 'East Point Medical College Hospital (EPH)', 'Vinay Kumar'],
//     ['Security', 'CCTV /Security Staff', 'Camera not recording', 'East Point College of Engineering & Technology (EPCET)', 'Kiran Raj'],
//     ['Security', 'CCTV /Security Staff', 'Visibility issue', 'East Point College of Pharmacy (EPCP)', 'Lokesh M'],
//     ['Security', 'CCTV /Security Staff', 'Security Staff', 'East Point College of Higher Education (EPCHE)', 'Harish Nayak'],
//     ['Security', 'CCTV /Security Staff', 'Staff not available', 'East Point College of Management (EPCM)', 'Sunil Reddy'],
//     ['Security', 'CCTV /Security Staff', 'Misconduct issue', 'East Point College of Nursing (EPCN)', 'Mahesh Hegde'],
//     ['Security', 'Others', 'Others', 'East Point School of Nursing (EPSN)', 'Dinesh Kumar'],
//     ['Security', 'Others', 'Others', 'New Royal College of Nursing (NRCN)', 'Santosh Poojary'],
//     ['Security', 'Others', 'Others', 'East Point College of Physiotherapy (EPCPT)', 'Venkatesh Murthy'],
//     ['Security', 'Others', 'Others', 'East Point Allied Health Sciences (EPAHS)', 'Shashank Rao']
//   ];

//   for (const entry of assignmentEntries) {
//     const [department, issueCategory, subCategory, institution, assignedPerson] = entry;
//     if (!assignedPerson) continue;

//     const staff = await get('SELECT id FROM users WHERE name = ? AND role = ?', [assignedPerson, 'staff']);
//     if (!staff) {
//       console.warn(`Staff user not found: ${assignedPerson} – skipping assignment`);
//       continue;
//     }

//     try {
//       await run(
//         `INSERT OR IGNORE INTO assignment_rules
//          (institution, department, issue_category, sub_category, staff_id)
//          VALUES (?, ?, ?, ?, ?)`,
//         [institution, department, issueCategory, subCategory, staff.id]
//       );
//     } catch (err) {
//       console.error(`Failed to insert assignment for ${institution} / ${department} / ${issueCategory} / ${subCategory}`, err);
//     }
//   }

//   console.log(`Assignment rules seeded: ${assignmentEntries.length} entries processed.`);
// }


import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// 1. CONNECTION TO AIVEN
export const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

console.log("✅ Connected to Aiven Cloud Database!");

// --- EXPORTED HELPER FUNCTIONS (REQUIRED BY ROUTES) ---
export async function run(query, params = []) {
  const [result] = await db.execute(query, params);
  return { lastID: result.insertId, changes: result.affectedRows };
}

export async function get(query, params = []) {
  const [rows] = await db.execute(query, params);
  return rows[0]; // Returns the first row found
}

export async function all(query, params = []) {
  const [rows] = await db.execute(query, params);
  return rows; // Returns all rows found
}

// 2. MAIN SEEDING LOGIC
export async function initDatabase() {
  console.log("🚀 Starting Full Cloud Seeding (Staff + Rules)...");

  // --- CREATE TABLES ---
  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL,
    mobile VARCHAR(20),
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add columns only if they don't exist (prevents crash on restart)
  try { await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20)`); } catch (e) {}
  try { await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255)`); } catch (e) {}

  await db.execute(`CREATE TABLE IF NOT EXISTS institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS assignment_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution VARCHAR(150) NOT NULL,
    department VARCHAR(150) NOT NULL,
    issue_category VARCHAR(150) NOT NULL,
    sub_category VARCHAR(150) NOT NULL,
    staff_id INT NOT NULL,
    FOREIGN KEY (staff_id) REFERENCES users(id),
    UNIQUE KEY rule_id (institution, department, issue_category, sub_category)
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    issue_category VARCHAR(255) NOT NULL,
    sub_category VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'New',
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  )`);

  // --- SEED INSTITUTIONS ---
  const institutionsList = [
    'East Point College of Medical Sciences & Research Centre (EPCMSR)',
    'East Point Medical College Hospital (EPH)',
    'East Point College of Engineering & Technology (EPCET)',
    'East Point College of Pharmacy (EPCP)',
    'East Point College of Higher Education (EPCHE)',
    'East Point College of Management (EPCM)',
    'East Point College of Nursing (EPCN)',
    'East Point School of Nursing (EPSN)',
    'New Royal College of Nursing (NRCN)',
    'East Point College of Physiotherapy (EPCPT)',
    'East Point Allied Health Sciences (EPAHS)'
  ];
  for (const name of institutionsList) {
    await db.execute('INSERT IGNORE INTO institutions (name) VALUES (?)', [name]);
  }

  // --- SEED STAFF USERS ---
  const staffNames = [
    'Mr Devraj', 'Mr Basil', 'Mr Senthil Kumar', 'Mr Vinod', 'Mr Sathish',
    'Mr Manjunath', 'Mr Anand', 'Mr Vinod Kumar', 'Ramesh Gowda', 'Manjunath K',
    'Praveen Kumar', 'Naveen Shetty', 'Darshan Rao', 'Suresh Babu', 'Vinay Kumar',
    'Kiran Raj', 'Lokesh M', 'Harish Nayak', 'Sunil Reddy', 'Mahesh Hegde',
    'Dinesh Kumar', 'Santosh Poojary', 'Venkatesh Murthy', 'Shashank Rao', 'Jagadish Gowda',
    'Nithin Shekar', 'Ravi Shankar', 'Chandrashekar Bhat'
  ];

  const staffPassword = await bcrypt.hash('staff123', 10);
  for (const name of staffNames) {
    const email = name.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@staff.eastpoint.edu';
    await db.execute(
      'INSERT IGNORE INTO users (name, email, password, role, mobile) VALUES (?, ?, ?, ?, ?)',
      [name, email, staffPassword, 'staff', '']
    );
  }

  // --- SEED ASSIGNMENT RULES (FULL LIST) ---
  const assignmentEntries = [
    ['IT Department', 'Hardware Issues', 'Desktop/Laptop not working', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Mr Devraj'],
    ['IT Department', 'Hardware Issues', 'System not powering on', 'East Point Medical College Hospital (EPH)', 'Mr Basil'],
    ['IT Department', 'Hardware Issues', 'Keyboard/Mouse faulty', 'East Point College of Engineering & Technology (EPCET)', 'Mr Senthil Kumar'],
    ['IT Department', 'Hardware Issues', 'Printer not working', 'East Point College of Pharmacy (EPCP)', 'Mr Vinod'],
    ['IT Department', 'Hardware Issues', 'Scanner issues', 'East Point College of Higher Education (EPCHE)', 'Mr Sathish'],
    ['IT Department', 'Software Issues', 'Application not opening', 'East Point College of Management (EPCM)', 'Mr Manjunath'],
    ['IT Department', 'Software Issues', 'HIS/ERP issues', 'East Point College of Nursing (EPCN)', 'Mr Anand'],
    ['IT Department', 'Software Issues', 'Login problems', 'East Point School of Nursing (EPSN)', 'Mr Anand'],
    ['IT Department', 'Software Issues', 'Software crash', 'New Royal College of Nursing (NRCN)', 'Mr Vinod Kumar'],
    ['IT Department', 'Software Issues', 'License expired', 'East Point College of Physiotherapy (EPCPT)', 'Mr Vinod Kumar'],
    ['IT Department', 'Network Issues', 'No internet', 'East Point Allied Health Sciences (EPAHS)', 'Mr Vinod Kumar'],
    ['Electrical', 'Power Supply', 'Power failure', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Ramesh Gowda'],
    ['Electrical', 'Power Supply', 'Generator not working', 'East Point Medical College Hospital (EPH)', 'Manjunath K'],
    ['Electrical', 'Power Supply', 'UPS not working', 'East Point College of Engineering & Technology (EPCET)', 'Praveen Kumar'],
    ['Electrical', 'Lighting', 'Light not working', 'East Point College of Pharmacy (EPCP)', 'Naveen Shetty'],
    ['Electrical', 'Lighting', 'Flickering light', 'East Point College of Higher Education (EPCHE)', 'Darshan Rao'],
    ['Electrical', 'Lighting', 'Emergency light failure', 'East Point College of Management (EPCM)', 'Suresh Babu'],
    ['Electrical', 'Switches & Sockets', 'Switch not working', 'East Point College of Nursing (EPCN)', 'Vinay Kumar'],
    ['Electrical', 'Switches & Sockets', 'Socket not working', 'East Point School of Nursing (EPSN)', 'Kiran Raj'],
    ['Electrical', 'Switches & Sockets', 'Loose connection', 'New Royal College of Nursing (NRCN)', 'Lokesh M'],
    ['Electrical', 'Others', 'Others', 'East Point College of Physiotherapy (EPCPT)', 'Harish Nayak'],
    ['Electrical', 'Others', 'Others', 'East Point Allied Health Sciences (EPAHS)', 'Sunil Reddy'],
    ['Plumbing', 'Water Supply', 'No water supply', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Mahesh Hegde'],
    ['Plumbing', 'Water Supply', 'Low water pressure', 'East Point Medical College Hospital (EPH)', 'Dinesh Kumar'],
    ['Plumbing', 'Water Supply', 'Irregular supply', 'East Point College of Engineering & Technology (EPCET)', 'Santosh Poojary'],
    ['Plumbing', 'Leakage', 'Water leakage', 'East Point College of Pharmacy (EPCP)', 'Venkatesh Murthy'],
    ['Plumbing', 'Leakage', 'Pipe leakage', 'East Point College of Higher Education (EPCHE)', 'Shashank Rao'],
    ['Plumbing', 'Leakage', 'Tank overflow', 'East Point College of Management (EPCM)', 'Jagadish Gowda'],
    ['Plumbing', 'Sanitary Fixtures', 'Tap not working', 'East Point College of Nursing (EPCN)', 'Nithin Shekar'],
    ['Plumbing', 'Sanitary Fixtures', 'Toilet flush not working', 'East Point School of Nursing (EPSN)', 'Ravi Shankar'],
    ['Plumbing', 'Sanitary Fixtures', 'Washbasin issue', 'New Royal College of Nursing (NRCN)', 'Chandrashekar Bhat'],
    ['Plumbing', 'Drainage', 'Drain blockage', 'East Point College of Physiotherapy (EPCPT)', 'Mahesh Hegde'],
    ['Plumbing', 'Drainage', 'Slow drainage', 'East Point Allied Health Sciences (EPAHS)', 'Dinesh Kumar'],
    ['Civil / Infrastructure', 'Structural Issues', 'Wall cracks', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Ramesh Gowda'],
    ['Civil / Infrastructure', 'Structural Issues', 'Structural damage', 'East Point Medical College Hospital (EPH)', 'Manjunath K'],
    ['Civil / Infrastructure', 'Ceiling', 'Ceiling damage', 'East Point College of Engineering & Technology (EPCET)', 'Praveen Kumar'],
    ['Civil / Infrastructure', 'Ceiling', 'Water seepage', 'East Point College of Pharmacy (EPCP)', 'Naveen Shetty'],
    ['Civil / Infrastructure', 'Ceiling', 'False ceiling issue', 'East Point College of Higher Education (EPCHE)', 'Darshan Rao'],
    ['Civil / Infrastructure', 'Flooring', 'Floor tile damage', 'East Point College of Management (EPCM)', 'Suresh Babu'],
    ['Civil / Infrastructure', 'Flooring', 'Uneven flooring', 'East Point College of Nursing (EPCN)', 'Vinay Kumar'],
    ['Civil / Infrastructure', 'Flooring', 'Broken tiles', 'East Point School of Nursing (EPSN)', 'Kiran Raj'],
    ['Civil / Infrastructure', 'Painting & Finishing', 'Painting required', 'New Royal College of Nursing (NRCN)', 'Lokesh M'],
    ['Civil / Infrastructure', 'Painting & Finishing', 'Paint peeling', 'East Point College of Physiotherapy (EPCPT)', 'Harish Nayak'],
    ['Civil / Infrastructure', 'Painting & Finishing', 'Surface damage', 'East Point Allied Health Sciences (EPAHS)', 'Sunil Reddy'],
    ['General Maintenance', 'Furniture', 'Furniture damage', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Ramesh Gowda'],
    ['General Maintenance', 'Furniture', 'Broken chair/table', 'East Point Medical College Hospital (EPH)', 'Manjunath K'],
    ['General Maintenance', 'Furniture', 'Cupboard issue', 'East Point College of Engineering & Technology (EPCET)', 'Praveen Kumar'],
    ['General Maintenance', 'Doors & Windows', 'Door not closing/opening', 'East Point College of Pharmacy (EPCP)', 'Naveen Shetty'],
    ['General Maintenance', 'Doors & Windows', 'Window damage', 'East Point College of Higher Education (EPCHE)', 'Darshan Rao'],
    ['General Maintenance', 'Doors & Windows', 'Hinges issue', 'East Point College of Management (EPCM)', 'Suresh Babu'],
    ['General Maintenance', 'Locks & Fixtures', 'Lock not working', 'East Point College of Nursing (EPCN)', 'Vinay Kumar'],
    ['General Maintenance', 'Locks & Fixtures', 'Key missing', 'East Point School of Nursing (EPSN)', 'Kiran Raj'],
    ['General Maintenance', 'Locks & Fixtures', 'Latch issue', 'New Royal College of Nursing (NRCN)', 'Lokesh M'],
    ['General Maintenance', 'Minor Repairs', 'Small repair required', 'East Point College of Physiotherapy (EPCPT)', 'Harish Nayak'],
    ['General Maintenance', 'Minor Repairs', 'Nail/fixture issue', 'East Point Allied Health Sciences (EPAHS)', 'Sunil Reddy'],
    ['General Maintenance', 'Minor Repairs', 'General wear and tear', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Mahesh Hegde'],
    ['General Maintenance', 'Others', 'Others', 'East Point Medical College Hospital (EPH)', 'Dinesh Kumar'],
    ['Security', 'CCTV /Security Staff', 'Surveillance (CCTV)', 'East Point College of Medical Sciences & Research Centre (EPCMSR)', 'Suresh Babu'],
    ['Security', 'CCTV /Security Staff', 'CCTV not working', 'East Point Medical College Hospital (EPH)', 'Vinay Kumar'],
    ['Security', 'CCTV /Security Staff', 'Camera not recording', 'East Point College of Engineering & Technology (EPCET)', 'Kiran Raj'],
    ['Security', 'CCTV /Security Staff', 'Visibility issue', 'East Point College of Pharmacy (EPCP)', 'Lokesh M'],
    ['Security', 'CCTV /Security Staff', 'Security Staff', 'East Point College of Higher Education (EPCHE)', 'Harish Nayak'],
    ['Security', 'CCTV /Security Staff', 'Staff not available', 'East Point College of Management (EPCM)', 'Sunil Reddy'],
    ['Security', 'CCTV /Security Staff', 'Misconduct issue', 'East Point College of Nursing (EPCN)', 'Mahesh Hegde'],
    ['Security', 'Others', 'Others', 'East Point School of Nursing (EPSN)', 'Dinesh Kumar'],
    ['Security', 'Others', 'Others', 'New Royal College of Nursing (NRCN)', 'Santosh Poojary'],
    ['Security', 'Others', 'Others', 'East Point College of Physiotherapy (EPCPT)', 'Venkatesh Murthy'],
    ['Security', 'Others', 'Others', 'East Point Allied Health Sciences (EPAHS)', 'Shashank Rao']
  ];

  for (const entry of assignmentEntries) {
    const [department, issueCategory, subCategory, institution, staffName] = entry;
    const [staffRows] = await db.execute('SELECT id FROM users WHERE name = ?', [staffName]);
    if (staffRows.length > 0) {
      await db.execute(
        'INSERT IGNORE INTO assignment_rules (institution, department, issue_category, sub_category, staff_id) VALUES (?, ?, ?, ?, ?)',
        [institution, department, issueCategory, subCategory, staffRows[0].id]
      );
    }
  }

  // Admin Account
  const hashedAdminPass = await bcrypt.hash('admin123', 10);
  await db.execute(`INSERT IGNORE INTO users (name, email, password, role, mobile) 
    VALUES ('Administrator', 'admin@eastpoint.edu', ?, 'admin', '9999999999')`, [hashedAdminPass]);

  console.log("✨ All Data Seeded to Aiven MySQL!");
}

// Auto-run if needed, but exports remain available for the server
initDatabase().then(() => {
  console.log("🚀 MySQL Cloud Setup Complete.");
}).catch(err => {
  console.error("❌ Seeding Failed:", err);
});