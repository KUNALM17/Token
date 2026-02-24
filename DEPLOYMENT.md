# 🚀 Deployment Guide

## Production Checklist

- [ ] Use strong `JWT_SECRET` (generate: `openssl rand -base64 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Use production Razorpay keys (not test keys)
- [ ] Use production Fast2SMS keys (if needed)
- [ ] Configure production PostgreSQL (managed database)
- [ ] Enable HTTPS/SSL
- [ ] Set up Redis for production
- [ ] Configure CORS for your domain
- [ ] Add error tracking (Sentry, LogRocket)
- [ ] Set up monitoring & logging
- [ ] Database backups enabled
- [ ] Rate limiting configured

---

## Backend Deployment

### Option 1: Heroku (Easiest)

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-hospital-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:standard-0

# Set environment variables
heroku config:set JWT_SECRET="your-secret-key-here"
heroku config:set RAZORPAY_KEY_ID="prod_key_id"
heroku config:set RAZORPAY_KEY_SECRET="prod_secret"
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Run migrations
heroku run npm run prisma:migrate

# Check logs
heroku logs --tail
```

### Option 2: AWS EC2

```bash
# Connect to EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL client
sudo yum install -y postgresql

# Clone repo
git clone your-repo
cd backend

# Install dependencies
npm install

# Setup environment
nano .env
# Add all production variables

# Build
npm run build

# Install PM2 for process management
npm install -g pm2

# Start server
pm2 start npm --name "hospital-api" -- start

# Monitor
pm2 logs
pm2 monit
```

### Option 3: DigitalOcean App Platform

1. Push code to GitHub
2. Create new App in DigitalOcean
3. Connect GitHub repository
4. Select `backend` as source directory
5. Add PostgreSQL database
6. Set environment variables
7. Deploy

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Option 2: Netlify

```bash
# Build
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Option 3: AWS S3 + CloudFront

```bash
# Build
npm run build

# Install AWS CLI
pip install awscli

# Configure AWS
aws configure

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

## Database Setup (Production)

### AWS RDS PostgreSQL

1. Create RDS instance (PostgreSQL 12+)
2. Set master username/password
3. Allow security group inbound on port 5432
4. Get endpoint: `your-db.xxxxx.us-east-1.rds.amazonaws.com`
5. Set `DATABASE_URL`:
```
postgresql://username:password@your-db.xxxxx.us-east-1.rds.amazonaws.com:5432/hospital_token_db
```

### Digital Ocean Managed Database

1. Create PostgreSQL cluster
2. Get connection string from console
3. Set `DATABASE_URL` to connection string

### Heroku PostgreSQL

Automatically created when you add addon (see Heroku section above)

---

## Redis Setup (Optional but Recommended)

### Upstash (Serverless)

1. Sign up: https://upstash.com
2. Create Redis database
3. Copy Redis URL
4. Set `REDIS_URL` environment variable

### AWS ElastiCache

1. Create ElastiCache Redis cluster
2. Get endpoint
3. Set `REDIS_URL` environment variable

---

## Environment Variables (Production)

Create `.env` with:

```env
# Database (use production managed service)
DATABASE_URL="postgresql://username:password@prod-db.example.com:5432/hospital_token_db"

# JWT
JWT_SECRET="generate-with-openssl-rand-base64-32"
JWT_EXPIRY="7d"

# Fast2SMS
FAST2SMS_API_KEY="your-prod-api-key"

# Razorpay (PRODUCTION KEYS!)
RAZORPAY_KEY_ID="rzp_live_xxxxx"
RAZORPAY_KEY_SECRET="your-live-secret-key"

# Redis (optional)
REDIS_URL="redis://default:password@your-redis-host:port"

# Server
PORT=5000
NODE_ENV="production"
FRONTEND_URL="https://your-frontend-domain.com"

# OTP
OTP_EXPIRY=300
```

---

## CORS Configuration (Production)

Update in `backend/src/index.ts`:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## SSL Certificate

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificate location
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Domain Setup

### Point Domain to Your Server

```
DNS A Record: your-domain.com → your-server-ip
DNS A Record: api.your-domain.com → your-server-ip (for backend)
```

### Or Use CDN

**Cloudflare (Recommended)**:
1. Add domain to Cloudflare
2. Update nameservers at registrar
3. Turn on "SSL/TLS" to Full
4. Set origin IP to your backend server

---

## Database Backups

### Automated Backups

**AWS RDS**:
- Automatic backups enabled by default
- Retention: 7 days
- Can extend to 35 days

**DigitalOcean**:
- Automatic backups via cluster settings
- Retention: 7 days

### Manual Backup (PostgreSQL)

```bash
# Backup
pg_dump -U username -h hostname -d hospital_token_db > backup.sql

# Restore
psql -U username -h hostname -d hospital_token_db < backup.sql
```

---

## Monitoring & Logging

### Error Tracking

**Sentry**:
```bash
npm install @sentry/node
```

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Application Monitoring

**PM2 Plus**:
```bash
pm2 plus
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY
```

### Logging

Use structured logging:
```typescript
console.log(JSON.stringify({
  timestamp: new Date(),
  level: 'info',
  message: 'User logged in',
  userId: user.id
}));
```

---

## Performance Optimization

### Backend
- Enable gzip compression
- Set up Redis caching
- Use database connection pooling
- Enable query optimization in Prisma

### Frontend
- Minify CSS/JS (Vite does this)
- Lazy load routes
- Code split
- Use CDN for static assets

### Database
- Add indexes (Prisma schema has them)
- Regular VACUUM ANALYZE
- Monitor slow queries

---

## Scaling

### Horizontal Scaling (Multiple Instances)

```
Load Balancer (Nginx/HAProxy)
├── Backend Instance 1
├── Backend Instance 2
└── Backend Instance 3

Shared:
├── PostgreSQL (RDS)
└── Redis (Upstash)
```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY tsconfig.json .
COPY prisma ./prisma

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Build and push:
```bash
docker build -t hospital-api .
docker tag hospital-api:latest your-registry/hospital-api:latest
docker push your-registry/hospital-api:latest
```

---

## Health Checks

Frontend should ping health endpoint:

```typescript
setInterval(async () => {
  try {
    await fetch(`${API_URL}/health`);
  } catch (error) {
    console.error('API is down');
  }
}, 60000); // Every minute
```

---

## Rollback Plan

1. Keep previous version running
2. Health checks active
3. Quick rollback via:
   - Heroku: `heroku releases:rollback`
   - Git: `git revert COMMIT_HASH && git push`
   - Docker: Switch to previous image

---

## Post-Deployment Checklist

- [ ] Test OTP login
- [ ] Test payment flow (real card, but test mode)
- [ ] Test database connectivity
- [ ] Check error logs
- [ ] Monitor CPU/Memory usage
- [ ] Test API endpoints
- [ ] Verify CORS headers
- [ ] Check SSL certificate
- [ ] Test email notifications (if added)
- [ ] Load test with artillery/k6

---

## Maintenance

### Weekly
- Check error logs
- Monitor disk space
- Review slow queries

### Monthly
- Update dependencies
- Security patches
- Performance optimization

### Quarterly
- Database optimization
- Certificate renewal
- Disaster recovery test

---

**You're ready for production! 🚀**
