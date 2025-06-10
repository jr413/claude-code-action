# Deployment Guide

This guide covers deploying the video streaming platform to production using AWS services.

## Prerequisites

- AWS Account
- Domain name
- SSL certificate (AWS Certificate Manager)
- Stripe account
- PostgreSQL database (AWS RDS)
- S3 bucket for video storage
- CloudFront distribution

## Environment Setup

### 1. Backend Environment Variables

Create `.env.production` file:

```env
# Server
PORT=3001
NODE_ENV=production

# Database (RDS)
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=video_streaming_prod
DB_USER=postgres
DB_PASSWORD=your-secure-password

# JWT
JWT_SECRET=your-very-secure-jwt-secret-minimum-32-chars
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=your-video-bucket

# CORS
FRONTEND_URL=https://yourdomain.com

# Email (SES)
SMTP_HOST=email-smtp.ap-northeast-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_user
SMTP_PASS=your_ses_smtp_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 2. Frontend Environment Variables

Create `.env.production` file:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
VITE_APP_NAME="StreamHub"
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

## AWS Infrastructure Setup

### 1. RDS PostgreSQL Setup

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier video-streaming-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.9 \
  --master-username postgres \
  --master-user-password your-secure-password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxx \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00"

# Create database and run migrations
psql -h your-rds-endpoint.amazonaws.com -U postgres
CREATE DATABASE video_streaming_prod;
\c video_streaming_prod
\i database/schema.sql
```

### 2. S3 Bucket Setup

```bash
# Create S3 bucket for videos
aws s3 mb s3://your-video-bucket --region ap-northeast-1

# Set bucket policy for CloudFront access
aws s3api put-bucket-policy --bucket your-video-bucket --policy file://s3-bucket-policy.json

# Enable CORS
aws s3api put-bucket-cors --bucket your-video-bucket --cors-configuration file://s3-cors.json
```

`s3-bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity XXXXXX"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-video-bucket/*"
    }
  ]
}
```

### 3. CloudFront Setup

Create CloudFront distribution for video streaming:

```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### 4. EC2 Setup for Backend

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0xxx \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxx \
  --subnet-id subnet-xxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=video-streaming-backend}]'

# Connect to instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone and setup backend
git clone https://github.com/your-repo/video-streaming-app.git
cd video-streaming-app/backend
npm install
npm run build

# Start with PM2
pm2 start dist/index.js --name video-streaming-api
pm2 save
pm2 startup
```

### 5. Frontend Deployment (S3 + CloudFront)

```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXXXX \
  --paths "/*"
```

## Security Considerations

### 1. SSL/TLS Setup

- Use AWS Certificate Manager for SSL certificates
- Enable HTTPS only on CloudFront
- Redirect HTTP to HTTPS

### 2. Security Groups

Backend security group:
- Port 3001: From ALB only
- Port 22: From your IP only

RDS security group:
- Port 5432: From backend security group only

### 3. IAM Roles

Create IAM role for EC2 with policies:
- S3 access for video bucket
- CloudWatch logs
- SES for emails

### 4. Secrets Management

Use AWS Secrets Manager or Parameter Store for:
- Database credentials
- API keys
- JWT secrets

## Monitoring and Logging

### 1. CloudWatch Setup

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure and start
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
sudo systemctl start amazon-cloudwatch-agent
```

### 2. Application Monitoring

- Set up CloudWatch alarms for:
  - High CPU usage
  - Memory usage
  - API response times
  - Error rates

### 3. Log Aggregation

Configure PM2 to send logs to CloudWatch:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'video-streaming-api',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    error_file: '/var/log/pm2/error.log',
    out_file: '/var/log/pm2/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
}
```

## Backup Strategy

### 1. Database Backups

- Enable automated RDS backups
- Take manual snapshots before major updates
- Test restore procedures regularly

### 2. Video Backups

- Enable S3 versioning
- Set up cross-region replication
- Implement lifecycle policies

## Scaling Considerations

### 1. Auto Scaling

Set up EC2 Auto Scaling:
```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name video-streaming-backend \
  --launch-template-data file://launch-template.json

# Create Auto Scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name video-streaming-asg \
  --launch-template LaunchTemplateName=video-streaming-backend \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:region:account-id:targetgroup/name
```

### 2. Database Scaling

- Use RDS read replicas for read-heavy operations
- Consider Aurora PostgreSQL for better performance
- Implement connection pooling

### 3. CDN Optimization

- Use CloudFront behaviors for different content types
- Set appropriate cache headers
- Enable compression

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] S3 buckets created and configured
- [ ] CloudFront distributions set up
- [ ] SSL certificates installed
- [ ] Security groups configured
- [ ] IAM roles and policies created
- [ ] Monitoring and alerts configured
- [ ] Backup procedures in place
- [ ] Load testing completed
- [ ] Stripe webhooks configured
- [ ] Email sending verified

## CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd backend
          npm ci
          npm run build
          npm run test
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_KEY }}
          script: |
            cd /app/video-streaming-app
            git pull
            cd backend
            npm ci
            npm run build
            pm2 restart video-streaming-api

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd frontend
          npm ci
          npm run build
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      - run: |
          aws s3 sync frontend/dist/ s3://${{ secrets.S3_BUCKET }} --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} --paths "/*"
```