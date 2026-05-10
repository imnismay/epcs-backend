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

// ----------------- CORS CONFIGURATION -----------------
// Allowed origins (add more if needed)
const allowedOrigins = [
  'https://epgi-ddx.pages.dev',     // your live frontend
  'http://localhost:3000',          // React dev server
  'http://localhost:5173',          // Vite (if used)
];

// If a single origin is provided via env, use that instead
const envOrigin = process.env.CORS_ORIGIN;
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // If env variable is set, use it (overrides array)
    if (envOrigin) {
      if (origin === envOrigin) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin} not allowed by env`));
    }
    
    // Otherwise check against the allowedOrigins array
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from: ${origin}`);
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    }
  },
  credentials: true,               // allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly (optional, cors does this automatically)
app.options('*', cors(corsOptions));

// Log every request origin (for debugging)
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} - Origin: ${req.headers.origin || 'no origin'}`);
  next();
});
// ------------------------------------------------------

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

// --- START SERVER (bind to 0.0.0.0 for cloud hosting) ---
initDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is live on port ${PORT}`);
      console.log(`🚀 Accepting external connections on 0.0.0.0`);
      console.log(`🔗 CORS allowed origins: ${envOrigin || allowedOrigins.join(', ')}`);
    });
  })
  .catch(err => {
    console.error('❌ Database initialization failed:', err);
  });
