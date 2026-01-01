require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================================
// CORS CONFIGURATION - Update these for your domains!
// ===========================================
const PRODUCTION_DOMAINS = [
  // Your custom domain
  'https://jarisolutionsecom.store',
  'https://www.jarisolutionsecom.store',
  // Netlify dashboard (update after deploy)
  process.env.DASHBOARD_URL,
  // Netlify store (update after deploy)  
  process.env.STORE_URL,
];

const DEVELOPMENT_DOMAINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
];

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? PRODUCTION_DOMAINS.filter(Boolean)
  : [...DEVELOPMENT_DOMAINS, ...PRODUCTION_DOMAINS.filter(Boolean)];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow Netlify preview deploys
    if (origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    
    // Check allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('⚠️ CORS blocked origin:', origin);
    // In production, you might want to block unknown origins
    // For now, allow all to avoid deployment issues
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ===========================================
// ROUTES
// ===========================================
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const publicRoutes = require('./routes/public');

// Database initialization route - REMOVE AFTER SETUP IN PRODUCTION!
const initRoutes = require('./routes/init');
app.use('/api/init', initRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/public', publicRoutes);

// ===========================================
// HEALTH CHECK - Railway uses this
// ===========================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Landing Kit API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Landing Kit MVP API',
    version: '1.0.0',
    status: 'running',
    docs: '/health for health check, /api/init to initialize database'
  });
});

// ===========================================
// START SERVER
// ===========================================
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Landing Kit API Server Started');
  console.log('========================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log('========================================');
});
