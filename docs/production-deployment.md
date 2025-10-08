# Production Deployment Guide

Complete guide for deploying Cosmoslide to production on a Mac Mini server.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements

- Mac Mini or similar server
- macOS with Docker Desktop installed
- 8GB+ RAM recommended
- 50GB+ free disk space
- Static IP or DDNS configured
- Domain name (cosmosli.de) with DNS configured

### DNS Configuration

Configure the following A records pointing to your server's public IP:

```
admin.cosmosli.de   → [YOUR_SERVER_IP]
api.cosmosli.de     → [YOUR_SERVER_IP]
v1.cosmosli.de      → [YOUR_SERVER_IP]
v2.cosmosli.de      → [YOUR_SERVER_IP]  (for future use)
```

### Port Forwarding

Configure your router to forward ports to the Mac Mini:

- Port 80 (HTTP) → Mac Mini IP:80
- Port 443 (HTTPS) → Mac Mini IP:443

## Initial Setup

### 1. Clone Repository

```bash
cd /path/to/your/projects
git clone https://github.com/yourusername/cosmoslide.git
cd cosmoslide
```

### 2. Install Dependencies

```bash
yarn install
```

## Environment Configuration

### 1. Create Production Environment File

```bash
cp .env.example .env
```

### 2. Edit `.env` File

Open `.env` and configure the following:

```bash
# ======================
# Database Configuration
# ======================
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD_123!
DB_NAME=cosmosli

# ======================
# Application
# ======================
PORT=3000
NODE_ENV=production

# ======================
# Federation
# ======================
FEDERATION_DOMAIN=api.cosmosli.de
FEDERATION_PROTOCOL=https

# ======================
# Redis Configuration
# ======================
REDIS_URL=redis://redis:6379

# ======================
# JWT Configuration
# ======================
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_xyz789

# ======================
# Mail Configuration
# ======================
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@cosmosli.de
MAIL_PASSWORD=your_app_specific_password
MAIL_FROM=noreply@cosmosli.de

# ======================
# S3 Storage (Cloudflare R2)
# ======================
AWS_ACCESS_KEY_ID=your_r2_access_key_id
AWS_SECRET_ACCESS_KEY=your_r2_secret_access_key
S3_BUCKET=cosmoslide-storage
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
S3_ENDPOINT=https://[account_id].r2.cloudflarestorage.com
S3_PUBLIC_URL=https://your-r2-public-url.com
MAX_FILE_SIZE_MB=200

# ======================
# Backup Configuration
# ======================
BACKUP_RETENTION_DAYS=30

# ======================
# Production Domain
# ======================
DOMAIN=cosmosli.de
```

### 3. Generate Secure Secrets

Generate secure random strings for JWT_SECRET and DB_PASSWORD:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate DB password
openssl rand -base64 24
```

## Deployment

### 1. Create Backup Directory

```bash
mkdir -p backups
chmod 755 backups
```

### 2. Build and Start Services

```bash
# Build and start all services in detached mode
docker-compose -f docker-compose.prod.yml up -d --build
```

This will start:
- Caddy (reverse proxy with automatic HTTPS)
- Backend API
- Frontend (V1)
- Admin Panel
- PostgreSQL
- Redis
- Backup Scheduler

### 3. Verify Services are Running

```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                      STATUS              PORTS
# cosmoslide-admin          Up (healthy)
# cosmoslide-backend        Up (healthy)
# cosmoslide-caddy          Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
# cosmoslide-frontend       Up (healthy)
# cosmoslide-postgres       Up (healthy)
# cosmoslide-redis          Up (healthy)
# cosmoslide-backup         Up
```

### 4. Check Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f caddy
```

## Post-Deployment

### 1. Run Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend yarn workspace @cosmoslide/backend migration:run
```

### 2. Verify Services

Test each service endpoint:

```bash
# Test Admin Panel
curl -I https://admin.cosmosli.de

# Test Backend API
curl -I https://api.cosmosli.de/health

# Test V1 Frontend
curl -I https://v1.cosmosli.de

# All should return HTTP 200 OK
```

### 3. Test SSL Certificates

Caddy automatically provisions SSL certificates from Let's Encrypt. Verify HTTPS is working:

```bash
# Should show valid SSL certificate
openssl s_client -connect api.cosmosli.de:443 -servername api.cosmosli.de < /dev/null
```

### 4. Create First User

Visit `https://v1.cosmosli.de` and create your first user account via magic link authentication.

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec backend yarn workspace @cosmoslide/backend migration:run
```

### Database Backups

Backups are automatically created daily at 2:00 AM KST by the backup scheduler.

#### Manual Backup

```bash
# Trigger manual backup
docker-compose -f docker-compose.prod.yml exec backup-scheduler npm start

# Backup files are stored in ./backups/
ls -lh backups/
```

#### Restore from Backup

```bash
# Stop backend service
docker-compose -f docker-compose.prod.yml stop backend

# Restore backup (replace YYYY-MM-DD with actual date)
gunzip -c backups/cosmoslide-backup-YYYY-MM-DD.sql.gz | \
  docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d cosmosli

# Start backend service
docker-compose -f docker-compose.prod.yml start backend
```

### System Resources

Monitor Docker resource usage:

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up unused resources (careful!)
docker system prune -a
```

## Troubleshooting

### Service Won't Start

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart specific service
docker-compose -f docker-compose.prod.yml restart [service-name]
```

### SSL Certificate Issues

```bash
# Check Caddy logs
docker-compose -f docker-compose.prod.yml logs caddy

# Caddy stores certificates in volumes
docker volume ls | grep caddy

# Force certificate renewal (if needed)
docker-compose -f docker-compose.prod.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cosmosli -c "SELECT version();"

# Check environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep DB_
```

### Redis Connection Issues

```bash
# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis

# Test Redis connection
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
# Should return: PONG
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up old Docker images
docker image prune -a

# Clean up old backups (keeps last 30 days by default)
find backups/ -name "cosmoslide-backup-*.sql.gz" -mtime +30 -delete
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase container resources in Docker Desktop settings
# Docker Desktop → Preferences → Resources

# Check database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d cosmosli -c "
  SELECT pid, usename, application_name, state, query
  FROM pg_stat_activity
  WHERE state != 'idle';"
```

## Security Recommendations

1. **Firewall**: Enable macOS firewall and only allow ports 80/443
2. **SSH**: If SSH is enabled, use key-based authentication only
3. **Updates**: Keep Docker Desktop and macOS updated
4. **Backups**: Store backups off-site (e.g., cloud storage)
5. **Secrets**: Never commit `.env` file to git
6. **Monitoring**: Set up monitoring/alerting for service downtime

## Adding V2 Frontend (Future)

When ready to add the V2 frontend:

1. Create `packages/frontend-v2/` with appropriate Dockerfile
2. Uncomment the `frontend-v2` service in `docker-compose.prod.yml`
3. Uncomment the v2 route in `Caddyfile`
4. Rebuild and restart:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/cosmoslide/issues
- Documentation: https://github.com/yourusername/cosmoslide/tree/main/docs

---

**Last Updated**: 2025-01-08
