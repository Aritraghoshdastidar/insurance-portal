# Insurance Workflow Automation System - Industry Standard Edition

## 🏢 Overview

A comprehensive, production-ready insurance automation platform built with modern architecture and industry best practices. This system handles policy management, claims processing, workflow automation, and analytics for insurance companies.

## ✨ Key Features

### Core Features
- **User Management**: Customer and Admin authentication with JWT and refresh tokens
- **Policy Management**: Browse, purchase, and manage insurance policies
- **Claims Processing**: File claims with automated workflow processing
- **Workflow Engine**: Visual workflow designer with step-by-step automation
- **Analytics Dashboard**: Real-time metrics, reports, and KPIs
- **Document Processing**: Intelligent document upload and OCR processing
- **Audit Logging**: Complete audit trail for compliance

### Technical Highlights
- **RESTful API**: Industry-standard REST APIs with Swagger documentation
- **Microservices Ready**: Modular architecture with separated concerns
- **Security First**: Helmet.js, rate limiting, input validation, SQL injection protection
- **Scalable**: Database connection pooling, Redis caching support
- **Observable**: Winston logging, health checks, metrics
- **Dockerized**: Complete Docker and Docker Compose setup
- **CI/CD Ready**: GitHub Actions workflow included

## 🏗️ Architecture

```
insurance-automation/
├── src/
│   ├── config/          # Configuration management
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic layer
│   ├── models/          # Data models
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   └── utils/           # Utility functions
├── insurance-frontend/  # React frontend
├── database_scripts/    # SQL scripts
├── logs/               # Application logs
├── uploads/            # File uploads
└── __tests__/          # Test suites
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Redis (optional but recommended)
- Docker & Docker Compose (optional)

### Installation

#### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd all_features_combined

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

#### Option 2: Manual Installation

```bash
# 1. Install backend dependencies
npm install

# 2. Install frontend dependencies
cd insurance-frontend
npm install
cd ..

# 3. Setup database
mysql -u root -p < database_scripts/insurance_db_dev_backup.sql

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 5. Start backend (terminal 1)
npm start

# 6. Start frontend (terminal 2)
cd insurance-frontend
npm start
```

## 📚 API Documentation

### API Versioning

The system supports both legacy (`/api/*`) and new versioned endpoints (`/api/v2/*`).

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /api/v2/auth/register` - Register new customer
- `POST /api/v2/auth/login` - Customer login
- `POST /api/v2/auth/admin/login` - Admin login
- `POST /api/v2/auth/refresh` - Refresh access token
- `POST /api/v2/auth/change-password` - Change password

#### Policies
- `GET /api/v2/policies` - List all policies
- `GET /api/v2/policies/:id` - Get policy details
- `POST /api/v2/policies/buy` - Purchase a policy

#### Claims
- `GET /api/v2/claims` - List claims
- `POST /api/v2/claims` - File a new claim
- `PATCH /api/v2/claims/:id` - Update claim status

#### Workflows
- `GET /api/v2/workflows` - List workflows
- `GET /api/v2/workflows/:id` - Get workflow details
- `PUT /api/v2/workflows/:id/definition` - Update workflow

For complete API documentation, visit: http://localhost:3001/api-docs

## 🔐 Security Features

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Express-validator for all inputs
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Helmet.js security headers
- **CORS**: Configurable cross-origin resource sharing
- **Password Hashing**: BCrypt with configurable rounds
- **Audit Logging**: Complete audit trail

## 📊 Database Schema

### Key Tables
- `customer` - Customer accounts
- `administrator` - Admin users
- `policy` - Insurance policies
- `claim` - Insurance claims
- `workflows` - Workflow definitions
- `workflow_steps` - Workflow step configuration
- `audit_log` - Audit trail
- `reminder` - Notifications

See `database_scripts/` for complete schema.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run frontend tests
cd insurance-frontend
npm test
```

## 📦 Deployment

### Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
PORT=3001

# Database
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=insurance_db

# JWT (CHANGE THESE!)
JWT_SECRET=your-strong-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Email
EMAIL_HOST=smtp.your-provider.com
EMAIL_USER=your-email
EMAIL_PASSWORD=your-password

# CORS
CORS_ORIGIN=https://your-domain.com
```

### Production Deployment Steps

1. **Build Frontend**
```bash
cd insurance-frontend
npm run build
```

2. **Configure Environment**
- Set all environment variables
- Use strong secrets for JWT
- Configure email service
- Set up Redis for caching

3. **Database Setup**
- Run migrations
- Set up backups
- Configure read replicas (if needed)

4. **Deploy with Docker**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

5. **Setup Monitoring**
- Configure log aggregation (ELK stack)
- Set up metrics (Prometheus/Grafana)
- Configure alerts

## 🔧 Configuration

### Rate Limiting

Configure in `src/config/config.js`:
```javascript
rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit per window
}
```

### Logging

Configure log level via environment:
```env
LOG_LEVEL=info  # debug, info, warn, error
```

### File Uploads

Configure in `src/config/config.js`:
```javascript
upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
}
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
mysql -u insurance_app -p insurance_db_dev

# Verify credentials in .env
cat .env | grep DB_
```

### Port Already in Use
```bash
# Windows: Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <pid> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Docker Issues
```bash
# Reset containers
docker-compose down -v
docker-compose up --build

# View logs
docker-compose logs backend
docker-compose logs frontend
```

## 📈 Performance Optimization

- Database connection pooling (10 connections)
- Redis caching for frequently accessed data
- Gzip compression for API responses
- CDN for static assets
- Query optimization with indexes
- Pagination for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is developed for educational purposes as part of PES University curriculum.

## 👥 Team

- **Logicore Team** - PES University AIML B Section
- Course: UE23CS341A
- Academic Year: 2025

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@insurance.com
- Documentation: http://localhost:3001/api-docs

## 🗺️ Roadmap

- [ ] Advanced fraud detection with ML
- [ ] Real-time chat support
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Advanced analytics with AI insights
- [ ] Multi-language support
- [ ] Blockchain for policy records
- [ ] Telematics integration

---

**Built with ❤️ by Team Logicore**
