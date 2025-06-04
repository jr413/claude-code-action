# TeleAI Pro Database Schema

## Overview

This database schema is designed for the TeleAI Pro Enterprise Audio Transcription and Analysis platform. It provides a robust data model for managing audio files, transcriptions, analyses, and user management with enterprise-grade features.

## Database Requirements

- PostgreSQL 12+ (for JSONB support and advanced indexing)
- Extensions required:
  - `uuid-ossp` - For UUID generation
  - `pgcrypto` - For cryptographic functions

## Schema Structure

### Core Tables

1. **users** - User account management
   - UUID primary keys for scalability
   - Role-based access control (admin, user, viewer)
   - Email validation constraints
   - Activity tracking

2. **sessions** - Authentication session management
   - Token-based authentication
   - IP address and user agent tracking
   - Automatic expiration handling

3. **audio_files** - Audio file metadata and storage
   - Support for multiple audio formats
   - Processing status tracking
   - Metadata storage in JSONB
   - File size and duration tracking

4. **transcriptions** - Speech-to-text results
   - Multi-language support
   - Confidence scoring
   - Full-text search capabilities
   - Engine versioning for reproducibility

5. **analyses** - AI-powered analysis results
   - Sentiment analysis
   - Entity extraction
   - Topic modeling
   - Key phrase extraction
   - Flexible JSONB storage for insights

### Relationships

```
users (1) -----> (N) audio_files
users (1) -----> (N) sessions
audio_files (1) -----> (N) transcriptions
transcriptions (1) -----> (N) analyses
```

### Key Features

1. **Performance Optimization**
   - Composite indexes on (user_id, created_at) for efficient user queries
   - GIN indexes on JSONB columns for fast JSON queries
   - Full-text search index on transcription text
   - Materialized views for analytics

2. **Data Integrity**
   - Foreign key constraints with CASCADE deletes
   - Check constraints for data validation
   - Custom types for status enums
   - Automatic timestamp updates via triggers

3. **Scalability**
   - UUID primary keys for distributed systems
   - Partitioning-ready design
   - Efficient indexing strategy
   - JSONB for flexible schema evolution

4. **Security**
   - Password hashes only (no plain text)
   - Session token hashing
   - Role-based access control
   - IP address tracking for audit

## Migration Guide

### Running Migrations

Migrations are located in the `database/migrations` directory and should be run in numerical order.

```bash
# Run all up migrations
psql -U your_user -d your_database -f database/migrations/001_create_initial_tables.up.sql
psql -U your_user -d your_database -f database/migrations/002_create_views.up.sql

# Rollback migrations (run in reverse order)
psql -U your_user -d your_database -f database/migrations/002_create_views.down.sql
psql -U your_user -d your_database -f database/migrations/001_create_initial_tables.down.sql
```

### Using a Migration Tool

For production environments, consider using a migration tool like:
- [golang-migrate](https://github.com/golang-migrate/migrate)
- [Flyway](https://flywaydb.org/)
- [Liquibase](https://www.liquibase.org/)

Example with golang-migrate:
```bash
migrate -path database/migrations -database "postgresql://user:password@localhost:5432/teleai?sslmode=disable" up
```

## Views and Analytics

### Available Views

1. **user_file_stats** - Aggregated statistics per user
2. **daily_usage_stats** - Daily platform usage metrics (materialized)
3. **recent_user_activity** - Unified activity feed
4. **processing_queue_status** - Real-time queue monitoring
5. **file_processing_pipeline** - End-to-end processing status

### Refreshing Materialized Views

```sql
-- Refresh daily usage statistics
REFRESH MATERIALIZED VIEW daily_usage_stats;

-- Schedule automatic refresh (using pg_cron or similar)
SELECT cron.schedule('refresh-daily-stats', '0 1 * * *', 'REFRESH MATERIALIZED VIEW daily_usage_stats;');
```

## Query Examples

### Get user's recent uploads
```sql
SELECT * FROM audio_files 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 10;
```

### Find transcriptions by keyword
```sql
SELECT * FROM transcriptions 
WHERE to_tsvector('english', transcription_text) @@ plainto_tsquery('english', ?);
```

### Get processing pipeline status
```sql
SELECT * FROM file_processing_pipeline 
WHERE user_id = ? 
AND pipeline_status != 'completed' 
ORDER BY audio_uploaded_at DESC;
```

### User activity summary
```sql
SELECT * FROM user_file_stats 
WHERE user_id = ?;
```

## Performance Considerations

1. **Indexing Strategy**
   - Primary keys are automatically indexed
   - Foreign keys have explicit indexes
   - Composite indexes for common query patterns
   - GIN indexes for JSONB and full-text search

2. **Query Optimization**
   - Use the composite indexes (user_id, created_at) for time-based queries
   - Leverage JSONB operators for metadata queries
   - Use materialized views for expensive aggregations

3. **Maintenance**
   - Regular VACUUM and ANALYZE
   - Monitor index usage with pg_stat_user_indexes
   - Consider partitioning for audio_files and transcriptions tables at scale

## Security Best Practices

1. **Application Level**
   - Always hash passwords before storage
   - Use parameterized queries to prevent SQL injection
   - Implement row-level security if needed

2. **Database Level**
   - Create specific database users for the application
   - Grant minimum required permissions
   - Use SSL/TLS for connections
   - Enable audit logging

## Backup and Recovery

1. **Backup Strategy**
   - Daily full backups
   - Continuous archiving with WAL
   - Test restore procedures regularly

2. **Point-in-Time Recovery**
   ```bash
   # Example backup command
   pg_dump -U postgres -d teleai -F custom -f teleai_backup_$(date +%Y%m%d).dump
   
   # Example restore command
   pg_restore -U postgres -d teleai_restore teleai_backup_20250604.dump
   ```

## Future Enhancements

1. **Planned Features**
   - Table partitioning for large-scale deployments
   - Additional analysis types support
   - Multi-tenancy support
   - Advanced RBAC with fine-grained permissions

2. **Performance Improvements**
   - Consider TimescaleDB for time-series data
   - Implement caching strategies
   - Add read replicas for analytics queries

## Support

For questions or issues related to the database schema:
- Check the migration files for detailed schema definitions
- Review the SQL comments for constraint explanations
- Consult PostgreSQL documentation for advanced features