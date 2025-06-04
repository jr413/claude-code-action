# TeleAI API Integration

This module provides a TypeScript client for integrating with the TeleAI Pro API, offering transcription, sentiment analysis, and text summarization capabilities.

## Features

- ✅ **Bearer Token Authentication**: Secure API access with token-based auth
- ✅ **Rate Limiting**: Built-in rate limiter (100 requests/minute)
- ✅ **Retry Logic**: Exponential backoff with configurable retries
- ✅ **Timeout Handling**: Configurable request timeouts (default: 30s)
- ✅ **Type Safety**: Full TypeScript support with comprehensive types
- ✅ **Error Handling**: Detailed error types for different scenarios

## Installation

```typescript
import { TeleAIClient } from './teleai';
```

## Quick Start

```typescript
// Initialize the client
const client = new TeleAIClient({
  apiKey: process.env.TELEAI_API_KEY,
  baseUrl: 'https://teleai-pro-api.onrender.com',
  timeout: 30000 // Optional: 30 seconds
});

// Transcribe audio
const transcription = await client.transcribe({
  audio: audioBuffer,
  language: 'en',
  format: 'json'
});

// Analyze sentiment
const sentiment = await client.analyzeSentiment({
  text: 'I love this product!',
  language: 'en'
});

// Extract summary
const summary = await client.extractSummary({
  text: longText,
  maxLength: 200,
  language: 'en'
});

// Check API health
const health = await client.health();
```

## API Reference

### TeleAIClient

The main client class for interacting with the TeleAI API.

#### Constructor

```typescript
new TeleAIClient(config: TeleAIConfig)
```

**Parameters:**
- `config.apiKey` (string, required): Your TeleAI API key
- `config.baseUrl` (string, required): The base URL of the TeleAI API
- `config.timeout` (number, optional): Request timeout in milliseconds (default: 30000)

#### Methods

##### transcribe(request: TranscribeRequest): Promise<TranscribeResponse>

Transcribes audio to text.

**Request:**
- `audio` (string | Buffer): Audio data (base64 string or Buffer)
- `language` (string, optional): Language code (e.g., 'en', 'ja')
- `format` (string, optional): Response format ('json' or 'text')

**Response:**
- `text` (string): Transcribed text
- `language` (string, optional): Detected language
- `confidence` (number, optional): Confidence score
- `segments` (array, optional): Time-aligned segments

##### analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentAnalysisResponse>

Analyzes sentiment of text.

**Request:**
- `text` (string): Text to analyze
- `language` (string, optional): Language code

**Response:**
- `sentiment` ('positive' | 'negative' | 'neutral' | 'mixed'): Overall sentiment
- `confidence` (number): Confidence score (0-1)
- `scores` (object): Individual sentiment scores

##### extractSummary(request: ExtractSummaryRequest): Promise<ExtractSummaryResponse>

Generates a summary of text.

**Request:**
- `text` (string): Text to summarize
- `maxLength` (number, optional): Maximum summary length
- `language` (string, optional): Language code

**Response:**
- `summary` (string): Generated summary
- `keyPoints` (string[], optional): Key points extracted

##### health(): Promise<HealthResponse>

Checks API health status.

**Response:**
- `status` ('healthy' | 'degraded' | 'unhealthy'): Overall status
- `version` (string): API version
- `uptime` (number): Uptime in seconds
- `services` (object): Individual service statuses

##### getRateLimitInfo()

Gets current rate limit information.

**Returns:**
- `remaining` (number): Remaining requests in current window
- `limit` (number): Total requests allowed per window
- `windowMs` (number): Window duration in milliseconds

## Error Handling

The client provides specific error types for different scenarios:

```typescript
try {
  const result = await client.transcribe(request);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication errors (401)
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    // Handle rate limit errors (429)
    console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof TeleAIError) {
    // Handle other API errors
    console.error(`API error: ${error.message} (${error.statusCode})`);
  }
}
```

## Rate Limiting

The client automatically enforces rate limits (100 requests/minute). When the limit is exceeded, a `RateLimitError` is thrown with a `retryAfter` property indicating when to retry.

```typescript
// Check remaining requests
const { remaining, limit } = client.getRateLimitInfo();
console.log(`${remaining}/${limit} requests remaining`);
```

## Retry Logic

The client automatically retries failed requests with exponential backoff:
- Retries on network errors and 5xx status codes
- Does not retry on 4xx client errors
- Maximum 3 retries by default
- Exponential backoff: 1s, 2s, 4s (capped at 10s)

## Environment Variables

Recommended environment setup:

```bash
TELEAI_API_KEY=your-api-key-here
TELEAI_API_URL=https://teleai-pro-api.onrender.com
```

## Testing

Run tests with:

```bash
bun test test/teleai-*.test.ts
```

The test suite includes:
- Unit tests for all components
- Mock API responses
- Error handling scenarios
- Rate limiting behavior
- Retry logic verification

## Security Best Practices

1. **API Key Storage**: Never commit API keys to version control
2. **Environment Variables**: Use environment variables for sensitive data
3. **HTTPS Only**: Always use HTTPS URLs for API endpoints
4. **Token Rotation**: Regularly rotate API keys
5. **Error Handling**: Don't expose sensitive information in error messages

## Performance Considerations

1. **Connection Pooling**: The client reuses connections for better performance
2. **Timeout Configuration**: Adjust timeout based on your use case
3. **Rate Limit Planning**: Plan your request rate to avoid hitting limits
4. **Retry Strategy**: Configure retry settings based on your reliability needs

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your API key is correct
   - Check if the key has necessary permissions
   - Ensure the key hasn't expired

2. **Rate Limit Errors**
   - Implement request queuing
   - Use the rate limit info to pace requests
   - Consider upgrading your plan for higher limits

3. **Timeout Errors**
   - Increase timeout for large requests
   - Check network connectivity
   - Verify API endpoint is accessible

4. **Network Errors**
   - Check firewall settings
   - Verify DNS resolution
   - Ensure stable internet connection