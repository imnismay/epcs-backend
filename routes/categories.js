import express from 'express';
import { all, get } from '../database.js';

const router = express.Router();

router.get('/departments', async (req, res) => {
  const departments = await all('SELECT id, name FROM departments ORDER BY name');
  res.json(departments);
});

router.get('/:department/categories', async (req, res) => {
  const { department } = req.params;
  const dept = await get('SELECT id FROM departments WHERE name = ?', [department]);
  if (!dept) {
    return res.status(404).json({ error: 'Department not found' });
  }
  const categories = await all(
    'SELECT id, name FROM issue_categories WHERE department_id = ? ORDER BY name',
    [dept.id]
  );
  res.json(categories);
});

router.get('/categories/:categoryId/subcategories', async (req, res) => {
  const { categoryId } = req.params;
  const subcategories = await all(
    'SELECT id, name FROM sub_categories WHERE category_id = ? ORDER BY name',
    [categoryId]
  );
  res.json(subcategories);
});

export default router;