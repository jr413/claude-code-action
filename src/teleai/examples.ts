import { TeleAIClient } from './client';
import type { 
  TranscribeRequest, 
  SentimentAnalysisRequest, 
  ExtractSummaryRequest 
} from './types';

/**
 * Example: Basic usage of TeleAI API client
 */
async function basicExample() {
  // Initialize client
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key',
    baseUrl: 'https://teleai-pro-api.onrender.com',
    timeout: 30000
  });

  try {
    // Check API health
    const health = await client.health();
    console.log('API Status:', health.status);
    console.log('Version:', health.version);

    // Transcribe audio
    const transcribeRequest: TranscribeRequest = {
      audio: 'base64-encoded-audio-data',
      language: 'en',
      format: 'json'
    };
    const transcription = await client.transcribe(transcribeRequest);
    console.log('Transcription:', transcription.text);

    // Analyze sentiment
    const sentimentRequest: SentimentAnalysisRequest = {
      text: 'I absolutely love this new feature! It works perfectly.',
      language: 'en'
    };
    const sentiment = await client.analyzeSentiment(sentimentRequest);
    console.log('Sentiment:', sentiment.sentiment);
    console.log('Confidence:', sentiment.confidence);

    // Extract summary
    const summaryRequest: ExtractSummaryRequest = {
      text: `TeleAI Pro is an advanced AI platform that provides comprehensive 
             natural language processing capabilities. It offers transcription 
             services with high accuracy, sentiment analysis for understanding 
             customer feedback, and intelligent text summarization. The platform 
             is designed for enterprise use with robust security, scalability, 
             and reliability features.`,
      maxLength: 100,
      language: 'en'
    };
    const summary = await client.extractSummary(summaryRequest);
    console.log('Summary:', summary.summary);

  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Error handling with specific error types
 */
async function errorHandlingExample() {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key',
    baseUrl: 'https://teleai-pro-api.onrender.com'
  });

  try {
    const result = await client.analyzeSentiment({
      text: 'Test text'
    });
    console.log('Result:', result);
  } catch (error: any) {
    if (error.name === 'AuthenticationError') {
      console.error('Authentication failed. Please check your API key.');
    } else if (error.name === 'RateLimitError') {
      console.error(`Rate limit exceeded. Retry after ${error.retryAfter} seconds.`);
    } else if (error.name === 'TeleAIError') {
      console.error(`API Error (${error.statusCode}): ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example: Rate limit aware processing
 */
async function rateLimitAwareExample() {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key',
    baseUrl: 'https://teleai-pro-api.onrender.com'
  });

  const texts = [
    'First text to analyze',
    'Second text to process',
    'Third text for sentiment',
    // ... more texts
  ];

  for (const text of texts) {
    // Check rate limit before making request
    const { remaining, limit } = client.getRateLimitInfo();
    console.log(`Rate limit: ${remaining}/${limit}`);

    if (remaining === 0) {
      console.log('Rate limit reached, waiting...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
    }

    try {
      const result = await client.analyzeSentiment({ text });
      console.log(`Sentiment for "${text}": ${result.sentiment}`);
    } catch (error: any) {
      if (error.name === 'RateLimitError') {
        console.log(`Rate limited. Waiting ${error.retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
        // Retry the request
        const result = await client.analyzeSentiment({ text });
        console.log(`Sentiment for "${text}": ${result.sentiment}`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Example: Batch processing with concurrent requests
 */
async function batchProcessingExample() {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key',
    baseUrl: 'https://teleai-pro-api.onrender.com'
  });

  const documents = [
    { id: '1', text: 'Document 1 content...' },
    { id: '2', text: 'Document 2 content...' },
    { id: '3', text: 'Document 3 content...' }
  ];

  // Process documents in parallel (respecting rate limits)
  const results = await Promise.allSettled(
    documents.map(async (doc) => {
      try {
        const [sentiment, summary] = await Promise.all([
          client.analyzeSentiment({ text: doc.text }),
          client.extractSummary({ text: doc.text, maxLength: 50 })
        ]);
        return {
          id: doc.id,
          sentiment: sentiment.sentiment,
          summary: summary.summary
        };
      } catch (error) {
        return {
          id: doc.id,
          error: error.message
        };
      }
    })
  );

  // Process results
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Document ${result.value.id}:`, result.value);
    } else {
      console.error(`Failed to process document ${documents[index].id}:`, result.reason);
    }
  });
}

/**
 * Example: Stream processing for large files
 */
async function streamProcessingExample() {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key',
    baseUrl: 'https://teleai-pro-api.onrender.com'
  });

  // Simulate processing audio chunks
  const audioChunks = [
    'chunk1-base64',
    'chunk2-base64',
    'chunk3-base64'
  ];

  const transcriptions: string[] = [];

  for (const [index, chunk] of audioChunks.entries()) {
    console.log(`Processing chunk ${index + 1}/${audioChunks.length}`);
    
    try {
      const result = await client.transcribe({
        audio: chunk,
        language: 'en'
      });
      transcriptions.push(result.text);
    } catch (error) {
      console.error(`Failed to process chunk ${index + 1}:`, error);
      // Continue with next chunk
    }
  }

  // Combine all transcriptions
  const fullTranscription = transcriptions.join(' ');
  console.log('Full transcription:', fullTranscription);

  // Analyze the complete text
  const sentiment = await client.analyzeSentiment({
    text: fullTranscription
  });
  console.log('Overall sentiment:', sentiment.sentiment);
}

// Export examples for testing
export {
  basicExample,
  errorHandlingExample,
  rateLimitAwareExample,
  batchProcessingExample,
  streamProcessingExample
};