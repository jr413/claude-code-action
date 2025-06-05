import { TeleAIClient } from './client'
import type {
  TranscribeResponse,
  AnalyzeSentimentResponse,
  ExtractSummaryResponse
} from './types'

// Example 1: Basic transcription
async function basicTranscription() {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key'
  })

  try {
    const result = await client.transcribe({
      audio: 'base64-encoded-audio-data',
      language: 'en'
    })
    
    console.log('Transcription:', result.text)
    console.log('Duration:', result.duration, 'seconds')
  } catch (error) {
    console.error('Transcription failed:', error)
  }
}

// Example 2: Sentiment analysis pipeline
async function sentimentAnalysisPipeline(text: string) {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key'
  })

  try {
    // Analyze sentiment
    const sentiment = await client.analyzeSentiment({ text })
    
    // Generate appropriate response based on sentiment
    if (sentiment.sentiment === 'negative' && sentiment.confidence > 0.8) {
      console.log('Customer appears upset. Escalating to support team...')
    } else if (sentiment.sentiment === 'positive' && sentiment.confidence > 0.9) {
      console.log('Customer is satisfied. Sending thank you message...')
    }
    
    return sentiment
  } catch (error) {
    console.error('Sentiment analysis failed:', error)
    throw error
  }
}

// Example 3: Complete audio processing workflow
async function completeAudioWorkflow(audioBuffer: Buffer) {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key',
    timeout: 60000 // 1 minute for large files
  })

  const results = {
    transcription: null as TranscribeResponse | null,
    sentiment: null as AnalyzeSentimentResponse | null,
    summary: null as ExtractSummaryResponse | null
  }

  try {
    // Step 1: Transcribe audio
    console.log('Transcribing audio...')
    results.transcription = await client.transcribe({
      audio: audioBuffer,
      format: 'json'
    })
    console.log(`Transcribed ${results.transcription.duration}s of audio`)

    // Step 2: Analyze sentiment
    console.log('Analyzing sentiment...')
    results.sentiment = await client.analyzeSentiment({
      text: results.transcription.text
    })
    console.log(`Sentiment: ${results.sentiment.sentiment} (${results.sentiment.confidence * 100}% confidence)`)

    // Step 3: Extract summary
    console.log('Generating summary...')
    results.summary = await client.extractSummary({
      text: results.transcription.text,
      style: 'bullets',
      maxLength: 200
    })
    console.log('Summary generated')

    return results
  } catch (error) {
    console.error('Workflow failed:', error)
    throw error
  }
}

// Example 4: Rate limit aware processing
async function rateLimitAwareProcessing(items: string[]) {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key'
  })

  const results = []

  for (const item of items) {
    // Check rate limit before each request
    const rateLimitInfo = client.getRateLimitInfo()
    
    if (rateLimitInfo.remaining < 5) {
      console.log(`Low on API calls. Waiting until ${rateLimitInfo.reset}`)
      const waitTime = rateLimitInfo.reset.getTime() - Date.now()
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    try {
      const result = await client.analyzeSentiment({ text: item })
      results.push(result)
    } catch (error: any) {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        console.log('Rate limit hit, stopping batch processing')
        break
      }
      throw error
    }
  }

  return results
}

// Example 5: Health monitoring
async function monitorAPIHealth() {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key'
  })

  try {
    const health = await client.health()
    
    if (health.status === 'healthy') {
      console.log('✅ API is healthy')
      console.log(`Version: ${health.version}`)
      console.log(`Uptime: ${Math.floor(health.uptime / 3600)} hours`)
      
      // Check individual services
      for (const [service, status] of Object.entries(health.services)) {
        console.log(`  ${service}: ${status.status}${status.latency ? ` (${status.latency}ms)` : ''}`)
      }
    } else {
      console.log(`⚠️ API status: ${health.status}`)
    }
  } catch (error) {
    console.error('❌ Health check failed:', error)
  }
}

// Example 6: Batch processing with error handling
async function batchProcessDocuments(documents: string[]) {
  const client = new TeleAIClient({
    apiKey: process.env.TELEAI_API_KEY || 'your-api-key',
    maxRetries: 5 // More retries for batch operations
  })

  const results = {
    successful: [] as any[],
    failed: [] as { document: string; error: any }[]
  }

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i]
    console.log(`Processing document ${i + 1}/${documents.length}`)

    try {
      // Extract summary for each document
      const summary = await client.extractSummary({
        text: doc,
        style: 'paragraph',
        maxLength: 150
      })

      // Analyze sentiment of the summary
      const sentiment = await client.analyzeSentiment({
        text: summary.summary
      })

      results.successful.push({
        original: doc,
        summary: summary.summary,
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence
      })
    } catch (error: any) {
      console.error(`Failed to process document ${i + 1}:`, error.message)
      results.failed.push({ document: doc, error })
      
      // Stop batch if we hit rate limits
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        console.log('Rate limit reached, stopping batch processing')
        break
      }
    }
  }

  console.log(`Processed: ${results.successful.length} successful, ${results.failed.length} failed`)
  return results
}

// Export examples for testing
export {
  basicTranscription,
  sentimentAnalysisPipeline,
  completeAudioWorkflow,
  rateLimitAwareProcessing,
  monitorAPIHealth,
  batchProcessDocuments
}