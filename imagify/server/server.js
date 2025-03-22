import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import userRouter from './routes/userRoutes.js';
import connectDB from './configs/mongodb.js';
import imageRouter from './routes/imageRoutes.js';

// App Config
const PORT = process.env.PORT || 3000;
const app = express();

// Connect to MongoDB
try {
    await connectDB();
    console.log('MongoDB connected successfully');
} catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
}

// Intialize Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // 10 minutes
}))

// Add security headers middleware
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
try {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log('Press Ctrl+C to stop');
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use`);
        } else {
            console.error('Server error:', error);
        }
        process.exit(1);
    });

    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}