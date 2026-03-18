require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
//const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const jwt = require('jsonwebtoken');

const connectDB = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const configureCloudinary = require('./src/config/cloudinary');

const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/utils/logger');
const { sanitizeInput } = require('./src/middleware/validation');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const chatRoutes = require('./src/routes/chats');
const messageRoutes = require('./src/routes/messages');
const uploadRoutes = require('./src/routes/upload');
const callRoutes = require('./src/routes/calls');
const notificationRoutes = require('./src/routes/notifications');
const searchRoutes = require('./src/routes/search');
const pushRoutes = require('./src/routes/push');
const favoritesRoutes = require('./src/routes/favorites');

const { socketHandler } = require('./src/sockets/socketHandler');

const app = express();
const server = http.createServer(app);

// ========== OPTIMIZED SOCKET.IO CONFIGURATION ==========
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:7300',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'], 
  allowEIO3: true,
  path: '/socket.io/',
  pingTimeout: 60000,        
  pingInterval: 25000,
  connectTimeout: 30000,
  maxHttpBufferSize: 1e6,
  serveClient: false,
  cookie: false,
  allowUpgrades: true,        
  perMessageDeflate: true,
  reconnection: true,        
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

console.log('✅ Socket.IO server initialized:', {
  origin: process.env.FRONTEND_URL || 'http://localhost:7300',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});


app.set('io', io);

// Connect to databases
connectDB();
connectRedis().catch(err => console.error('Redis connection failed:', err));

configureCloudinary();

// ========== CORS CONFIGURATION ==========
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:7300',
      'http://127.0.0.1:7300'
    ];
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization', 'Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.options('/*path', cors(corsOptions)); 


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:7300');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  

  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  console.log('   Origin:', req.headers.origin);
  console.log('   Auth:', req.headers.authorization ? 'Present' : 'Missing');
  next();
});

// ========== OTHER MIDDLEWARE ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL, "https://res.cloudinary.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Request logging
//app.use(morgan('combined', { stream: requestLogger.stream }));

// Sanitize input
app.use(sanitizeInput);

// ========== TEST ENDPOINTS ==========
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    success: true,
    message: 'CORS is working correctly!',
    origin: req.headers.origin 
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'production',
    socketIO: io.engine ? 'ready' : 'not ready'
  });
});

// TEMPORARY DEBUG ENDPOINT - FIXED VERSION
app.post('/api/debug/emit-conversation', (req, res) => {
  const { userId, conversation } = req.body;
  const io = req.app.get('io');
  
  console.log(`🔧 DEBUG: Manually emitting conversation to user ${userId}`);
  console.log(`🔧 DEBUG: Socket rooms for this user:`, io.sockets.adapter.rooms.get(userId));
  
  // Emit to the user's room
  io.to(userId).emit('conversation-updated', {
    conversationId: conversation._id,
    conversation: conversation,
    updates: {
      lastMessage: conversation.lastMessage,
      lastActivity: conversation.lastActivity,
      unreadCount: conversation.unreadCount
    }
  });
  
  // Also try emitting to all clients as a fallback
  io.emit('conversation-updated', {
    conversationId: conversation._id,
    conversation: conversation,
    updates: {
      lastMessage: conversation.lastMessage,
      lastActivity: conversation.lastActivity,
      unreadCount: conversation.unreadCount
    }
  });  
  
  res.json({ success: true, message: 'Event emitted', userId: userId });
});

// ========== API ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/favorites', favoritesRoutes);

// ========== INITIALIZE SOCKET HANDLER ==========
socketHandler(io);

// ========== PRODUCTION STATIC FILES ==========
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
}

// ========== DEBUG ROUTES ==========
app.get('/api/debug-routes', (req, res) => {
  const routes = [];
  const extractRoutes = (stack, basePath = '') => {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push({ path: basePath + layer.route.path, methods });
      } else if (layer.name === 'router' && layer.handle.stack) {
        const routerPath = layer.regexp.source
          .replace('\\/?(?=\\/|$)', '')
          .replace(/\\\//g, '/')
          .replace(/\^/g, '')
          .replace(/\?/g, '')
          .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param');
        extractRoutes(layer.handle.stack, routerPath);
      }
    });
  };
  extractRoutes(app._router.stack);
  res.json({ success: true, totalRoutes: routes.length, routes });
});

app.post('/api/debug-token', (req, res) => {
  const { token } = req.body;
  const secret = process.env.JWT_ACCESS_SECRET;
  try {
    const decoded = jwt.verify(token, secret);
    res.json({ success: true, decoded });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ========== ERROR HANDLING ==========
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log('\n🚀 ==================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:7300'}`);
  console.log(`📡 Socket.IO listening on ws://localhost:${PORT}`);
  console.log(`⚡ CORS enabled for: http://localhost:7300`);
  console.log('🚀 ==================================\n');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});