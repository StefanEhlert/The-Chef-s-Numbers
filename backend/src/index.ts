import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import recipeRoutes from './routes/recipes';
import imageRoutes from './routes/images';
import supplierRoutes from './routes/suppliers';
import postgresRoutes from './routes/postgres';
import minioRoutes from './routes/minio';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Database connections will be established dynamically via API calls

// Load environment variables
dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env['NODE_ENV'] === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({ 
    message: 'The Chef\'s Numbers Backend API',
    version: '1.0.0',
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      postgres: '/api/postgres-health',
      api: '/api/v1'
    }
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api', postgresRoutes);
app.use('/api/minio', minioRoutes);
app.use('/api/images', imageRoutes); // Intelligente Bild-APIs

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Start server without pre-initialized database
    // Database connections will be established dynamically via API calls
    app.listen(parseInt(PORT.toString()), '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`💡 Database connections will be established dynamically via API calls`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
