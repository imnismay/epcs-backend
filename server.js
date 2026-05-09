// import express from 'express';
// import cors from 'cors';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { initDatabase, all } from './database.js';  // all is imported here
// import authRoutes from './routes/auth.js';
// import categoryRoutes from './routes/categories.js';
// import complaintRoutes from './routes/complaints.js';
// import adminRoutes from './routes/admin.js';
// import staffRoutes from './routes/staff.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 5000;
// initDatabase().then(() => {
//   // Adding "0.0.0.0" is crucial for cloud deployments
//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`✅ Server is live on port ${PORT}`);
//     console.log(`🚀 Accepting external connections...`);
//   });
// }).catch(err => {
//   console.error("❌ Database initialization failed:", err);
// });

// // Middleware
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || 'https://epgi-ddx.pages.dev',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(express.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // ✅ Public endpoint – no token required
// app.get('/api/public/institutions', async (req, res) => {
//   try {
//     const rows = await all('SELECT name FROM institutions ORDER BY name');
//     const institutions = rows.map(row => row.name);
//     res.json(institutions);
//   } catch (err) {
//     console.error('Failed to fetch institutions:', err);
//     res.status(500).json({ error: 'Failed to fetch institutions' });
//   }
// });

// // Other routes (some may require authentication)
// app.use('/api/auth', authRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/complaints', complaintRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/staff', staffRoutes);

// // Initialize database and start server
// // initDatabase().then(() => {
// //   app.listen(PORT, () => {
// //     console.log(`Server running on port ${PORT}`);
// //   });
// // });

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, all } from './database.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import complaintRoutes from './routes/complaints.js';
import adminRoutes from './routes/admin.js';
import staffRoutes from './routes/staff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  // Uses the Railway variable if set, otherwise defaults to your Cloudflare URL
  origin: process.env.CORS_ORIGIN || 'https://epgi-ddx.pages.dev',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- PUBLIC ENDPOINTS ---
app.get('/api/public/institutions', async (req, res) => {
  try {
    const rows = await all('SELECT name FROM institutions ORDER BY name');
    const institutions = rows.map(row => row.name);
    res.json(institutions);
  } catch (err) {
    console.error('Failed to fetch institutions:', err);
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);

// --- SINGLE SERVER START BLOCK ---
// Start server immediately (don't wait for database)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is live on port ${PORT}`);
  console.log(`🚀 Accepting external connections at 0.0.0.0`);
});

// Run database seeding in background, but don't crash if it fails
initDatabase().catch(err => {
  console.error("❌ Seeding failed (server is still running):", err);
});
