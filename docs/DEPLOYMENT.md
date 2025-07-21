# Deployment Guide

This guide covers deployment strategies for the NWFTH Forms Management System in various environments.

## 🚀 Deployment Options

1. **Docker Compose (Recommended)** - Production-ready containerized deployment
2. **Manual Deployment** - Traditional server deployment
3. **Cloud Deployment** - Azure, AWS, or Google Cloud
4. **Development Deployment** - Local development setup

---

## 🐳 Docker Deployment (Recommended)

### Prerequisites
- Docker 20.0+
- Docker Compose 2.0+
- SQL Server instance (local or remote)

### Quick Deployment

1. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd NWFTH-Forms
   cp Form-App/.env.example Form-App/.env
   ```

2. **Configure environment**
   ```bash
   # Edit Form-App/.env with your settings
   nano Form-App/.env
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

4. **Verify deployment**
   ```bash
   curl http://localhost:5000/health
   ```

### Docker Compose Configuration

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  nwfth-forms:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./Form-App/.env
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Production Docker Configuration

**docker-compose.prod.yml:**
```yaml
version: '3.8'
services:
  nwfth-forms:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./Form-App/.env.production
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - app-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - nwfth-forms
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Docker Commands Reference

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f nwfth-forms

# Scale service
docker-compose up -d --scale nwfth-forms=3

# Update deployment
docker-compose pull
docker-compose up -d

# Backup data
docker-compose exec nwfth-forms npm run backup

# Stop services
docker-compose down

# Clean up
docker-compose down -v --remove-orphans
```

---

## 🛠️ Manual Deployment

### Prerequisites
- Node.js 18+
- npm or yarn
- SQL Server
- PM2 (process manager)
- Nginx (reverse proxy)

### Server Setup

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2**
   ```bash
   npm install -g pm2
   ```

3. **Install Nginx**
   ```bash
   sudo apt-get install nginx
   ```

### Application Deployment

1. **Clone repository**
   ```bash
   cd /opt
   sudo git clone <repository-url> nwfth-forms
   cd nwfth-forms
   sudo chown -R $USER:$USER .
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Build frontend**
   ```bash
   cd form-frontend
   npm run build
   cd ..
   ```

4. **Configure environment**
   ```bash
   cp Form-App/.env.example Form-App/.env
   nano Form-App/.env
   ```

5. **Start with PM2**
   ```bash
   pm2 start Form-App/server.js --name nwfth-forms
   pm2 save
   pm2 startup
   ```

### Nginx Configuration

**/etc/nginx/sites-available/nwfth-forms:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle large file uploads
    client_max_body_size 50M;

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/nwfth-forms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ☁️ Cloud Deployment

### Azure Deployment

#### Using Azure Container Instances

1. **Build and push image**
   ```bash
   # Create Azure Container Registry
   az acr create --resource-group myResourceGroup --name nwfthforms --sku Basic

   # Build and push
   az acr build --registry nwfthforms --image nwfth-forms:v1 .
   ```

2. **Deploy container**
   ```bash
   az container create \
     --resource-group myResourceGroup \
     --name nwfth-forms \
     --image nwfthforms.azurecr.io/nwfth-forms:v1 \
     --cpu 1 \
     --memory 1 \
     --registry-login-server nwfthforms.azurecr.io \
     --registry-username $(az acr credential show --name nwfthforms --query "username" -o tsv) \
     --registry-password $(az acr credential show --name nwfthforms --query "passwords[0].value" -o tsv) \
     --dns-name-label nwfth-forms-app \
     --ports 5000
   ```

#### Using Azure App Service

1. **Create App Service Plan**
   ```bash
   az appservice plan create \
     --name nwfth-forms-plan \
     --resource-group myResourceGroup \
     --sku B1 \
     --is-linux
   ```

2. **Deploy web app**
   ```bash
   az webapp create \
     --resource-group myResourceGroup \
     --plan nwfth-forms-plan \
     --name nwfth-forms-app \
     --deployment-container-image-name nwfthforms.azurecr.io/nwfth-forms:v1
   ```

### AWS Deployment

#### Using ECS Fargate

**task-definition.json:**
```json
{
  "family": "nwfth-forms",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "nwfth-forms",
      "image": "your-account.dkr.ecr.region.amazonaws.com/nwfth-forms:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nwfth-forms",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Deploy:**
```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster your-cluster \
  --service-name nwfth-forms \
  --task-definition nwfth-forms:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

### Google Cloud Deployment

#### Using Cloud Run

1. **Build and push**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/nwfth-forms
   ```

2. **Deploy**
   ```bash
   gcloud run deploy nwfth-forms \
     --image gcr.io/PROJECT_ID/nwfth-forms \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 512Mi \
     --cpu 1
   ```

---

## 🔧 Environment Configuration

### Production Environment Variables

**Form-App/.env.production:**
```env
# Application
NODE_ENV=production
PORT=5000

# Database
DB_SERVER=your-production-db-server
DB_NAME=TFCPILOT
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_PORT=1433

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-for-production

# Email
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=notifications@yourcompany.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM="NWFTH Forms <notifications@yourcompany.com>"

# Active Directory (if used)
AD_URL=ldap://your-domain-controller
AD_BASE_DN=DC=yourcompany,DC=com
AD_USERNAME=service-account
AD_PASSWORD=service-password

# File uploads
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# Monitoring
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
```

### SSL/TLS Configuration

**Generate SSL Certificate:**
```bash
# Using Let's Encrypt (recommended)
sudo certbot --nginx -d your-domain.com

# Or generate self-signed (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /path/to/ssl/private.key \
  -out /path/to/ssl/cert.pem
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoint

The application provides a health check endpoint at `/health`:

```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### Docker Health Checks

**Dockerfile health check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1
```

### Monitoring with Prometheus

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nwfth-forms'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

---

## 🔄 Backup & Recovery

### Database Backup

**Automated backup script:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/nwfth-forms"
DB_NAME="TFCPILOT"

mkdir -p $BACKUP_DIR

# SQL Server backup
sqlcmd -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -Q \
  "BACKUP DATABASE [$DB_NAME] TO DISK = '$BACKUP_DIR/nwfth_forms_$DATE.bak'"

# Compress backup
gzip $BACKUP_DIR/nwfth_forms_$DATE.bak

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.bak.gz" -mtime +30 -delete

echo "Backup completed: nwfth_forms_$DATE.bak.gz"
```

**Cron job for daily backups:**
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh >> /var/log/nwfth-backup.log 2>&1
```

### Application Backup

```bash
#!/bin/bash
# app-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/nwfth-forms-app"
APP_DIR="/opt/nwfth-forms"

mkdir -p $BACKUP_DIR

# Backup uploads and configuration
tar -czf $BACKUP_DIR/app_data_$DATE.tar.gz \
  $APP_DIR/uploads \
  $APP_DIR/Form-App/.env \
  $APP_DIR/logs

# Clean old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

---

## 🚨 Rollback Procedures

### Docker Rollback

```bash
# View deployment history
docker images nwfth-forms

# Rollback to previous version
docker-compose down
docker tag nwfth-forms:v1.0.1 nwfth-forms:latest
docker-compose up -d

# Or specify version in docker-compose.yml
# image: nwfth-forms:v1.0.0
```

### Manual Rollback

```bash
# Stop current version
pm2 stop nwfth-forms

# Checkout previous version
git checkout v1.0.0

# Rebuild if necessary
npm run install:all
cd form-frontend && npm run build && cd ..

# Restart application
pm2 start nwfth-forms
pm2 save
```

---

## 🔍 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check database connectivity
telnet your-db-server 1433

# Verify credentials
sqlcmd -S your-db-server -U your-user -P your-password
```

**2. Port Already in Use**
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

**3. Memory Issues**
```bash
# Monitor memory usage
docker stats nwfth-forms

# Increase memory limit
docker-compose up -d --scale nwfth-forms=1 --memory=1g
```

**4. SSL Certificate Issues**
```bash
# Check certificate
openssl x509 -in /path/to/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

### Log Analysis

```bash
# Application logs
docker-compose logs -f nwfth-forms

# PM2 logs
pm2 logs nwfth-forms

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

---

## 🔐 Security Checklist

- [ ] SSL/TLS enabled
- [ ] Environment variables secured
- [ ] Database credentials secured
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Regular security updates
- [ ] Backup encryption enabled
- [ ] Access logs monitored
- [ ] Rate limiting configured
- [ ] SQL injection prevention verified

---

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] SSL certificates installed
- [ ] Backup procedures tested
- [ ] Health checks configured
- [ ] Monitoring setup complete

### Deployment
- [ ] Application deployed successfully
- [ ] Health checks passing
- [ ] Database connectivity verified
- [ ] Static files serving correctly
- [ ] Email notifications working
- [ ] PDF generation functional

### Post-deployment
- [ ] Application accessible
- [ ] All features tested
- [ ] Performance metrics checked
- [ ] Logs reviewed
- [ ] Backup verified
- [ ] Documentation updated

---

For additional support, refer to the [Troubleshooting Guide](TROUBLESHOOTING.md) or create an issue in the repository.