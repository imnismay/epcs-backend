import { db, get, all } from './database.js';

async function debug() {
  console.log('=== USERS ===');
  const users = await all('SELECT id, name, role FROM users');
  console.table(users);

  console.log('\n=== LAST 5 COMPLAINTS ===');
  const complaints = await all(`
    SELECT id, user_name, assigned_to, status, department, issue_category, sub_category, institution
    FROM complaints ORDER BY id DESC LIMIT 5
  `);
  console.table(complaints);

  console.log('\n=== ASSIGNMENT RULES (IT/Software crash) ===');
  const rules = await all(`
    SELECT * FROM assignment_rules 
    WHERE department = 'IT Department' 
      AND issue_category = 'Software Issues' 
      AND sub_category = 'Software crash'
  `);
  console.table(rules);

  console.log('\n=== ALL ASSIGNMENT RULES (first 10) ===');
  const allRules = await all('SELECT institution, department, issue_category, sub_category, staff_id FROM assignment_rules LIMIT 10');
  console.table(allRules);

  process.exit();
}

debug();