# TeleAI API Integration Documentation

## Overview

The TeleAI API integration provides a comprehensive client library for interacting with the TeleAI Pro API. This integration includes authentication, rate limiting, retry logic, and support for all TeleAI endpoints.

## Installation

The TeleAI client is included in the project. No additional installation is required.

## Configuration

Create a new TeleAI client instance with your API configuration:

```typescript
import { TeleAIClient } from './src/teleai'

const client = new TeleAIClient({
  apiKey: process.env.TELEAI_API_KEY || 'your-api-key',
  baseUrl: 'https://teleai-pro-api.onrender.com', // optional, this is the default
  timeout: 30000, // optional, 30 seconds default
  maxRetries: 3 // optional, 3 retries default
})
```

## Features

### Authentication
- Bearer token authentication
- Automatic token management
- Secure credential storage

### Rate Limiting
- 100 requests per minute limit
- Automatic request throttling
- Rate limit information available via `getRateLimitInfo()`

### Retry Logic
- Exponential backoff with jitter
- Configurable max retries
- Retries on 5xx errors and network failures
- No retry on 4xx errors (except 408, 429)

### Error Handling
- Structured error responses with status codes
- Detailed error messages
- Network timeout handling

## API Endpoints

### 1. Transcribe Audio

Convert audio to text with language detection.

```typescript
const result = await client.transcribe({
  audio: audioBuffer, // Buffer or base64 string
  language: 'en', // optional
  format: 'json' // optional: 'text' | 'json' | 'srt' | 'vtt'
})

// Response
{
  text: "Transcribed text",
  language: "en",
  duration: 12.5,
  words: [
    { word: "Hello", start: 0.0, end: 0.5, confidence: 0.99 }
  ]
}
```

### 2. Analyze Sentiment

Analyze the sentiment of text content.

```typescript
const result = await client.analyzeSentiment({
  text: "I love this product!",
  language: 'en' // optional
})

// Response
{
  sentiment: "positive",
  confidence: 0.95,
  scores: {
    positive: 0.95,
    negative: 0.02,
    neutral: 0.03
  }
}
```

### 3. Extract Summary

Generate summaries from long text content.

```typescript
const result = await client.extractSummary({
  text: "Long article text...",
  maxLength: 200, // optional
  style: 'bullets' // optional: 'bullets' | 'paragraph'
})

// Response
{
  summary: "Concise summary of the text",
  keyPoints: [
    "Key point 1",
    "Key point 2"
  ]
}
```

### 4. Health Check

Check the API service health status.

```typescript
const health = await client.health()

// Response
{
  status: "healthy",
  version: "1.0.0",
  uptime: 3600,
  services: {
    api: { status: "operational" },
    database: { status: "operational", latency: 15 }
  }
}
```

## Rate Limit Information

Monitor your API usage:

```typescript
const rateLimitInfo = client.getRateLimitInfo()

console.log(`Limit: ${rateLimitInfo.limit}`)
console.log(`Remaining: ${rateLimitInfo.remaining}`)
console.log(`Reset: ${rateLimitInfo.reset}`)
```

## Error Handling

The client throws `TeleAIError` for API errors:

```typescript
try {
  const result = await client.transcribe({ audio: audioData })
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log('Rate limit hit, retry after:', error.details.retryAfter)
  } else if (error.statusCode === 401) {
    console.log('Invalid API key')
  } else {
    console.log('Error:', error.message)
  }
}
```

## Examples

### Basic Usage

```typescript
import { TeleAIClient } from './src/teleai'

async function main() {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY
  })

  // Check API health
  const health = await client.health()
  console.log('API Status:', health.status)

  // Transcribe audio
  const transcription = await client.transcribe({
    audio: fs.readFileSync('audio.mp3'),
    language: 'en'
  })
  console.log('Transcription:', transcription.text)

  // Analyze sentiment
  const sentiment = await client.analyzeSentiment({
    text: transcription.text
  })
  console.log('Sentiment:', sentiment.sentiment)

  // Extract summary
  const summary = await client.extractSummary({
    text: transcription.text,
    style: 'bullets'
  })
  console.log('Summary:', summary.summary)
}
```

### Advanced Usage with Error Handling

```typescript
async function processAudioWithRetry(audioPath: string) {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY,
    maxRetries: 5,
    timeout: 60000 // 1 minute for large files
  })

  try {
    // Check rate limit before processing
    const rateLimit = client.getRateLimitInfo()
    if (rateLimit.remaining < 5) {
      console.log(`Low on API calls. ${rateLimit.remaining} remaining.`)
    }

    // Process audio
    const audio = await fs.promises.readFile(audioPath)
    const result = await client.transcribe({
      audio,
      format: 'json'
    })

    return result
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      const resetTime = client.getRateLimitInfo().reset
      console.log(`Rate limit exceeded. Reset at ${resetTime}`)
      throw error
    } else if (error.statusCode === 413) {
      console.log('Audio file too large')
      throw error
    } else {
      console.error('Unexpected error:', error)
      throw error
    }
  }
}
```

## Testing

Run the test suite:

```bash
bun test test/teleai-*.test.ts
```

## Security Notes

1. Never commit API keys to version control
2. Use environment variables for sensitive configuration
3. Implement proper access controls in production
4. Monitor rate limits to avoid service disruption
5. Use HTTPS for all API communications

## Support

For issues or questions:
- Check the [TeleAI API Documentation](https://teleai-pro-api.onrender.com/docs)
- Open an issue in this repository
- Contact TeleAI support