require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// Import configuration
const config = require('./src/config/config');
const { testConnection } = require('./src/config/database');
const logger = require('./src/utils/logger');

// Import middleware
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Import routes (we'll create these)
const authRoutes = require('./src/routes/authRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const policyRoutes = require('./src/routes/policyRoutes');
const claimRoutes = require('./src/routes/claimRoutes');
const workflowRoutes = require('./src/routes/workflowRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

// Create Express app
const app = express();

// ============================================
// SECURITY & MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors(config.cors));

// Compression
app.use(compression());

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Rate Limiting
app.use('/api/', apiLimiter);

// ============================================
// SWAGGER API DOCUMENTATION
// ============================================

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Insurance Automation API',
            version: '2.0.0',
            description: 'Industry-standard Insurance Workflow Automation System API',
            contact: {
                name: 'Logicore Team',
                email: 'support@insurance.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${config.port}`,
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv
    });
});

app.get('/api/health', async (req, res) => {
    const dbStatus = await testConnection();
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: dbStatus ? 'connected' : 'disconnected',
            api: 'running'
        }
    });
});

// ============================================
// API ROUTES
// ============================================

// Legacy compatibility - keep old server.js endpoints working
const legacyRoutes = require('./server');
app.use(legacyRoutes.app);

// New modular routes
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/customers', customerRoutes);
app.use('/api/v2/admin', adminRoutes);
app.use('/api/v2/policies', policyRoutes);
app.use('/api/v2/claims', claimRoutes);
app.use('/api/v2/workflows', workflowRoutes);
app.use('/api/v2/analytics', analyticsRoutes);
app.use('/api/v2/payments', paymentRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            logger.error('Failed to connect to database');
            process.exit(1);
        }

        // Start server
        const PORT = config.port;
        
        if (process.env.NODE_ENV !== 'test') {
            const server = app.listen(PORT, () => {
                logger.info(`🚀 Server running on port ${PORT}`);
                logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
                logger.info(`🏥 Health check at http://localhost:${PORT}/health`);
                logger.info(`🌍 Environment: ${config.nodeEnv}`);
            });

            // Graceful shutdown
            process.on('SIGTERM', () => {
                logger.info('SIGTERM signal received: closing HTTP server');
                server.close(() => {
                    logger.info('HTTP server closed');
                    process.exit(0);
                });
            });

            return server;
        }

        return app;
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start server if not in test mode
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
