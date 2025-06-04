import { AudioWorkflowEngine } from '../src/audio-workflow';

// シンプルな使用例
async function basicExample() {
  console.log('=== Basic Audio Workflow Example ===\n');

  // エンジンの初期化
  const engine = new AudioWorkflowEngine({
    queueOptions: {
      maxConcurrency: 3,
      retryLimit: 2,
      retryDelay: 500
    }
  });

  // ワーカーの追加
  engine.addWorker({ id: 'worker-1', concurrency: 2 });
  engine.addWorker({ id: 'worker-2', concurrency: 1 });

  // ジョブの追加
  console.log('Adding jobs to queue...');
  const jobs = [];
  for (let i = 1; i <= 5; i++) {
    const job = engine.enqueueJob({
      audioFile: `audio-${i}.mp3`,
      format: 'wav',
      quality: 'high'
    });
    jobs.push(job);
    console.log(`Added job ${job.id}`);
  }

  // ヘルスチェック
  console.log('\nHealth Status:');
  console.log(engine.getHealthStatus());

  // 処理の待機
  console.log('\nProcessing jobs...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 結果の確認
  console.log('\nJob Results:');
  jobs.forEach(job => {
    const result = engine.getJob(job.id);
    console.log(`Job ${job.id}: ${result?.status} (retries: ${result?.retryCount})`);
  });

  // メトリクスの表示
  console.log('\nFinal Metrics:');
  console.log(engine.getMetrics());

  // キュー統計
  console.log('\nQueue Statistics:');
  console.log(engine.getQueueStats());

  // クリーンアップ
  engine.shutdown();
}

// カスタムプロセッサーの例
async function customProcessorExample() {
  console.log('\n=== Custom Processor Example ===\n');

  const engine = new AudioWorkflowEngine();

  // カスタムプロセッサーの定義
  engine.setProcessor(async (job) => {
    console.log(`Custom processor handling job ${job.id}`);
    
    // 実際のオーディオ処理をシミュレート
    const startTime = Date.now();
    
    // ここで実際のオーディオ処理を行う
    // 例: FFmpegを使った変換、音声解析、など
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    const processingTime = Date.now() - startTime;
    
    return {
      jobId: job.id,
      originalFile: job.data.audioFile,
      processedFile: job.data.audioFile.replace('.mp3', '.wav'),
      processingTime,
      metadata: {
        duration: Math.random() * 300,
        bitrate: 320,
        channels: 2
      }
    };
  });

  engine.addWorker({ id: 'custom-worker', concurrency: 2 });

  // ジョブの追加と処理
  const job = engine.enqueueJob({
    audioFile: 'podcast-episode-001.mp3',
    operations: ['normalize', 'compress', 'convert']
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  const result = engine.getJob(job.id);
  console.log('Processing result:', result);

  engine.shutdown();
}

// モニタリングの例
async function monitoringExample() {
  console.log('\n=== Monitoring Example ===\n');

  const engine = new AudioWorkflowEngine({
    queueOptions: {
      maxConcurrency: 5
    }
  });

  engine.addWorker({ id: 'monitor-worker-1', concurrency: 3 });
  engine.addWorker({ id: 'monitor-worker-2', concurrency: 2 });

  // 定期的なヘルスチェックを開始
  engine.startHealthMonitoring(1000);

  // 継続的にジョブを追加
  let jobCount = 0;
  const interval = setInterval(() => {
    if (jobCount < 20) {
      engine.enqueueJob({
        audioFile: `stream-${jobCount++}.mp3`,
        priority: Math.random() > 0.5 ? 'high' : 'normal'
      });
    }
  }, 300);

  // 10秒間モニタリング
  await new Promise(resolve => setTimeout(resolve, 10000));

  clearInterval(interval);
  engine.stopHealthMonitoring();

  // 最終統計
  console.log('\nFinal Statistics:');
  console.log('Health:', engine.getHealthStatus());
  console.log('Metrics:', engine.getMetrics());
  console.log('Queue:', engine.getQueueStats());

  engine.shutdown();
}

// エラーハンドリングの例
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===\n');

  const engine = new AudioWorkflowEngine({
    queueOptions: {
      retryLimit: 3,
      retryDelay: 1000
    }
  });

  // エラーを含むプロセッサー
  engine.setProcessor(async (job) => {
    const random = Math.random();
    
    if (random < 0.3) {
      throw new Error('Network timeout');
    } else if (random < 0.4) {
      throw new Error('Invalid audio format');
    }
    
    return { success: true };
  });

  engine.addWorker({ id: 'error-worker', concurrency: 2 });

  // ジョブの追加
  const jobs = [];
  for (let i = 0; i < 10; i++) {
    jobs.push(engine.enqueueJob({ audioFile: `test-${i}.mp3` }));
  }

  // 処理の待機
  await new Promise(resolve => setTimeout(resolve, 8000));

  // 結果の分析
  let completed = 0;
  let failed = 0;
  let retried = 0;

  jobs.forEach(job => {
    const result = engine.getJob(job.id);
    if (result?.status === 'completed') completed++;
    if (result?.status === 'failed') failed++;
    if (result && result.retryCount > 0) retried++;
  });

  console.log(`\nResults: ${completed} completed, ${failed} failed, ${retried} retried`);
  console.log('Queue stats:', engine.getQueueStats());

  engine.shutdown();
}

// すべての例を実行
async function runAllExamples() {
  await basicExample();
  await customProcessorExample();
  await monitoringExample();
  await errorHandlingExample();
}

// 実行
if (import.meta.main) {
  runAllExamples().catch(console.error);
}