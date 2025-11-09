require('dotenv').config();

module.exports = {
    // Server Configuration
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your_super_secret_key_12345',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    
    // Database Configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'insurance_app',
        password: process.env.DB_PASSWORD || 'app_password_123',
        name: process.env.DB_NAME || 'insurance_db_dev',
        port: process.env.DB_PORT || 3306
    },
    
    // Redis Configuration
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null
    },
    
    // Email Configuration
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM || 'noreply@insurance.com'
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },
    
    // Security
    bcryptRounds: 10,
    
    // File Upload
    upload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        uploadDir: process.env.UPLOAD_DIR || 'uploads/'
    },
    
    // Pagination
    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100
    },
    
    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
    }
};
