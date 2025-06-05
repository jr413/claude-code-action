# TeleAI Pro Enterprise Database Schema

## Overview

This database schema is designed for the TeleAI Pro Enterprise system, providing a robust data model for managing audio files, transcriptions, analyses, and user management with enterprise-grade features.

## Database Requirements

- PostgreSQL 13+ (recommended: PostgreSQL 15)
- Extensions required:
  - `uuid-ossp` - For UUID generation
  - `pgcrypto` - For cryptographic functions

## Schema Structure

### Core Tables

#### 1. Users Table (`users`)
Manages user accounts with role-based access control.

- **Primary Key**: `id` (UUID)
- **Unique Constraints**: `email`, `username`
- **Features**:
  - Role-based access control (admin, manager, analyst, viewer)
  - Soft deletion support
  - Activity tracking
  - JSON metadata storage

#### 2. Sessions Table (`sessions`)
Handles user authentication sessions.

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `user_id` → `users.id`
- **Features**:
  - Token-based authentication
  - IP and user agent tracking
  - Session expiration
  - Revocation support

#### 3. Audio Files Table (`audio_files`)
Stores audio file metadata and processing status.

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `user_id` → `users.id`
- **Features**:
  - Multiple format support (MP3, WAV, OGG, M4A, FLAC, WebM)
  - Processing status tracking
  - Comprehensive audio metadata
  - Error tracking

#### 4. Transcriptions Table (`transcriptions`)
Manages transcription data with versioning support.

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `audio_file_id` → `audio_files.id`
- **Features**:
  - Version control
  - Language support
  - Confidence scoring
  - Engine tracking
  - Latest version flagging

#### 5. Analyses Table (`analyses`)
Stores AI-powered analysis results.

- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `transcription_id` → `transcriptions.id`
- **Features**:
  - Multiple analysis types (sentiment, summary, keywords, entities, custom)
  - Flexible JSON result storage
  - Model tracking
  - Parameter storage

### Views

#### User Activity Summary View
Provides aggregated user statistics including:
- Total files uploaded
- Total transcriptions created
- Total analyses performed
- Last upload timestamp
- Last login timestamp

#### File Processing Analytics (Materialized View)
Offers daily analytics on file processing:
- File counts by format and status
- Average file sizes
- Average durations
- Average processing times

## Performance Optimization

### Indexes

The schema includes comprehensive indexing for optimal query performance:

1. **User Queries**:
   - Email lookup (filtered by active status)
   - Username lookup
   - Role-based filtering

2. **File Queries**:
   - User file listings (composite index on user_id + created_at)
   - Status filtering
   - Format filtering

3. **Transcription Queries**:
   - Latest version lookups
   - Language-based filtering
   - Full-text search on transcription content

4. **Analysis Queries**:
   - Type-based filtering
   - JSON content queries

### Row-Level Security

All main tables have Row-Level Security (RLS) enabled for multi-tenant support. Policies need to be configured based on your specific requirements.

## Migration Guide

### Initial Setup

1. Ensure PostgreSQL 13+ is installed
2. Create a new database:
   ```sql
   CREATE DATABASE teleai_pro;
   ```

3. Connect to the database and run the migration:
   ```bash
   psql -d teleai_pro -f database/migrations/001_initial_schema_up.sql
   ```

### Rollback

To rollback the schema:
```bash
psql -d teleai_pro -f database/migrations/001_initial_schema_down.sql
```

## Usage Examples

### Creating a User
```sql
INSERT INTO users (email, username, password_hash, role)
VALUES ('admin@teleai.pro', 'admin', 'hashed_password_here', 'admin');
```

### Recording an Audio File Upload
```sql
INSERT INTO audio_files (user_id, file_name, file_path, file_size, file_format)
VALUES ('user-uuid', 'interview.mp3', '/uploads/2025/06/interview.mp3', 5242880, 'mp3');
```

### Creating a Transcription
```sql
INSERT INTO transcriptions (audio_file_id, transcription_text, language_code, confidence_score)
VALUES ('audio-file-uuid', 'Transcribed text here...', 'en', 0.95);
```

### Running an Analysis
```sql
INSERT INTO analyses (transcription_id, analysis_type, result)
VALUES ('transcription-uuid', 'sentiment', '{"sentiment": "positive", "score": 0.85}'::jsonb);
```

## Maintenance

### Refreshing Materialized Views
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY file_processing_analytics;
```

### Monitoring Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Checking Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Security Considerations

1. **Password Storage**: Always use proper hashing (bcrypt, argon2) for passwords
2. **Token Management**: Implement token rotation and secure storage
3. **RLS Policies**: Configure appropriate row-level security policies
4. **Audit Logging**: Consider implementing audit triggers for sensitive operations
5. **Data Encryption**: Enable encryption at rest for sensitive data

## Backup and Recovery

### Backup Command
```bash
pg_dump -h localhost -U postgres -d teleai_pro -F c -f teleai_pro_backup.dump
```

### Restore Command
```bash
pg_restore -h localhost -U postgres -d teleai_pro -c teleai_pro_backup.dump
```

## Performance Tuning

Consider these PostgreSQL configuration adjustments for optimal performance:

```sql
-- Increase shared buffers for better caching
ALTER SYSTEM SET shared_buffers = '2GB';

-- Optimize for SSD storage
ALTER SYSTEM SET random_page_cost = 1.1;

-- Increase work memory for complex queries
ALTER SYSTEM SET work_mem = '64MB';

-- Enable parallel queries
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
```

## Monitoring Queries

### Active Sessions
```sql
SELECT 
    u.username,
    s.ip_address,
    s.created_at,
    s.last_accessed_at
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW() AND NOT s.is_revoked
ORDER BY s.last_accessed_at DESC;
```

### Processing Queue
```sql
SELECT 
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (NOW() - upload_started_at))) as avg_wait_seconds
FROM audio_files
WHERE status IN ('pending', 'processing')
GROUP BY status;
```

## Future Enhancements

Potential areas for schema expansion:

1. **Team/Organization Support**: Add organization and team tables for multi-tenant scenarios
2. **Billing Integration**: Add usage tracking and billing tables
3. **Workflow Management**: Add workflow and task management tables
4. **API Rate Limiting**: Add API usage tracking tables
5. **Advanced Analytics**: Add more specialized analysis result tables