# Audio Processing Workflow Engine

A robust, queue-based audio processing workflow engine with TypeScript support, designed for high-performance audio file processing with built-in monitoring and error recovery.

## Features

- **Queue Management**: Priority-based queue with configurable concurrency
- **Processing States**: Track jobs through pending, processing, completed, and failed states
- **Error Recovery**: Automatic retry mechanism with exponential backoff
- **Monitoring**: Real-time metrics and structured logging with correlation IDs
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Event-Driven**: Built on EventEmitter for reactive processing

## Installation

```bash
bun install
```

## Quick Start

```typescript
import { AudioWorkflowEngine } from './src/audio-workflow';
import type { AudioProcessingJob } from './src/audio-workflow/types';

// Initialize the engine
const engine = new AudioWorkflowEngine({
  maxConcurrency: 3,
  defaultMaxRetries: 3,
  retryDelay: 1000,
  healthCheckInterval: 30000
});

// Start the engine
await engine.start();

// Add a processing job
const job: AudioProcessingJob = {
  fileId: 'audio-123',
  fileName: 'podcast.mp3',
  fileSize: 50 * 1024 * 1024, // 50MB
  format: 'mp3',
  processingOptions: {
    normalize: true,
    removeNoise: true,
    convertFormat: 'wav',
    bitrate: 192000,
    sampleRate: 44100
  }
};

const queueItem = await engine.addJob(job, { priority: 5 });

// Check job status
const status = engine.getJob(queueItem.id);
console.log(`Job ${status?.id} is ${status?.state}`);

// Get metrics
const metrics = engine.getMetrics();
console.log('Workflow metrics:', metrics);

// Stop the engine when done
await engine.stop();
```

## Architecture

### Components

1. **Queue**: Generic priority queue implementation with event support
2. **WorkflowEngine**: Main orchestrator for audio processing jobs
3. **StructuredLogger**: JSON-based logging with correlation ID support
4. **Types**: Comprehensive TypeScript definitions

### Processing Flow

```
┌─────────────┐     ┌──────────┐     ┌────────────┐     ┌───────────┐
│   Add Job   │────▶│  Queue   │────▶│ Processing │────▶│ Completed │
└─────────────┘     └──────────┘     └────────────┘     └───────────┘
                           │                  │
                           │                  ▼
                           │           ┌────────────┐
                           └──────────▶│   Failed   │
                                      └────────────┘
                                            │
                                            ▼
                                      ┌────────────┐
                                      │   Retry    │
                                      └────────────┘
```

## API Reference

### AudioWorkflowEngine

#### Constructor

```typescript
new AudioWorkflowEngine(config?: {
  maxConcurrency?: number;      // Default: 3
  defaultMaxRetries?: number;   // Default: 3
  retryDelay?: number;         // Default: 1000ms
  healthCheckInterval?: number; // Default: 30000ms
})
```

#### Methods

- `start(): Promise<void>` - Start the workflow engine
- `stop(): Promise<void>` - Stop the workflow engine
- `addJob(job: AudioProcessingJob, options?: { priority?: number; maxRetries?: number }): Promise<QueueItem>` - Add a new processing job
- `getJob(jobId: string): QueueItem | undefined` - Get a specific job by ID
- `getAllJobs(): QueueItem[]` - Get all jobs in the queue
- `getMetrics(): WorkflowMetrics` - Get current workflow metrics
- `clearCompletedJobs(): void` - Remove completed jobs from memory

### Types

#### AudioProcessingJob

```typescript
interface AudioProcessingJob {
  fileId: string;
  fileName: string;
  fileSize: number;
  format: string;
  processingOptions: ProcessingOptions;
}
```

#### ProcessingOptions

```typescript
interface ProcessingOptions {
  normalize?: boolean;
  removeNoise?: boolean;
  convertFormat?: string;
  bitrate?: number;
  sampleRate?: number;
}
```

#### WorkflowMetrics

```typescript
interface WorkflowMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeJobs: number;
  averageProcessingTime: number;
  queueLength: number;
  lastHealthCheck: Date;
}
```

## Events

The queue emits the following events:

- `jobAdded`: When a new job is added to the queue
- `jobStarted`: When a job begins processing
- `jobCompleted`: When a job completes successfully
- `jobFailed`: When a job fails after all retries
- `jobRetrying`: When a job fails and will be retried

## Logging

The engine uses structured JSON logging with correlation IDs for request tracing:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "INFO",
  "service": "audio-workflow-engine",
  "correlationId": "job-lqr1234-0001-abcd",
  "message": "Processing audio file",
  "jobId": "job-lqr1234-0001-abcd",
  "fileName": "podcast.mp3",
  "format": "mp3",
  "options": {
    "normalize": true,
    "removeNoise": true
  }
}
```

## Testing

Run the test suite:

```bash
bun test
```

Test coverage includes:
- Unit tests for Queue, Logger, and WorkflowEngine
- Integration tests for full workflow scenarios
- Concurrency and priority handling tests
- Error recovery and retry mechanism tests

## Performance Considerations

- The engine processes jobs in parallel up to `maxConcurrency`
- Jobs are processed in priority order (higher priority first)
- Failed jobs are retried with exponential backoff
- Completed jobs should be cleared periodically to free memory
- Health checks run at configurable intervals

## Error Handling

The engine implements comprehensive error handling:

1. **Automatic Retries**: Failed jobs are retried up to `maxRetries` times
2. **Exponential Backoff**: Retry delay increases with each attempt
3. **Error Logging**: All errors are logged with full stack traces
4. **Graceful Degradation**: Individual job failures don't affect other jobs

## Monitoring

Monitor the workflow engine health through:

1. **Metrics API**: Real-time statistics via `getMetrics()`
2. **Health Checks**: Automatic periodic health status logging
3. **Event Monitoring**: Subscribe to queue events for custom monitoring
4. **Structured Logs**: Parse JSON logs for metrics aggregation

## Best Practices

1. **Set Appropriate Concurrency**: Balance between throughput and resource usage
2. **Use Priority Wisely**: Assign higher priority to time-sensitive jobs
3. **Monitor Metrics**: Track queue length and processing times
4. **Clear Completed Jobs**: Periodically clean up to prevent memory leaks
5. **Handle Events**: Subscribe to events for custom processing logic

## Example: Production Setup

```typescript
import { AudioWorkflowEngine } from './src/audio-workflow';

// Production configuration
const engine = new AudioWorkflowEngine({
  maxConcurrency: 10,
  defaultMaxRetries: 5,
  retryDelay: 2000,
  healthCheckInterval: 60000
});

// Custom error handling
engine.on('jobFailed', (job, error) => {
  console.error(`Job ${job.id} failed permanently:`, error);
  // Send alert to monitoring system
});

// Custom completion handling
engine.on('jobCompleted', (job) => {
  console.log(`Job ${job.id} completed in ${job.updatedAt - job.createdAt}ms`);
  // Update database, send notifications, etc.
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await engine.stop();
  process.exit(0);
});

await engine.start();
```