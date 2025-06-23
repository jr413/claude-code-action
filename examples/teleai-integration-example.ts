/**
 * TeleAI API統合の使用例
 * 
 * このファイルは、TeleAI APIクライアントの使い方を示すサンプルコードです。
 * 実際に使用する際は、環境変数からAPIキーを取得してください。
 */

import { TeleAIClient } from '../src/integrations/teleai';

// 環境変数からAPIキーを取得
const apiKey = process.env.TELEAI_API_KEY;
if (!apiKey) {
  console.error('エラー: TELEAI_API_KEY環境変数が設定されていません');
  process.exit(1);
}

// クライアントの初期化
const client = new TeleAIClient({
  baseUrl: process.env.TELEAI_API_BASE_URL || 'https://teleai-pro-api.onrender.com',
  apiKey: apiKey,
  timeout: 30000,        // 30秒のタイムアウト
  rateLimit: 100,        // 100リクエスト/分
  maxRetries: 3,         // 最大3回リトライ
});

/**
 * サンプル1: ヘルスチェック
 */
async function checkHealth() {
  console.log('\n=== ヘルスチェック ===');
  try {
    const health = await client.health();
    console.log('サービスステータス:', health.status);
    console.log('バージョン:', health.version);
    console.log('アップタイム:', `${Math.floor(health.uptime / 3600)}時間`);
    
    if (health.services) {
      console.log('各サービスの状態:');
      console.log('  - 文字起こし:', health.services.transcribe);
      console.log('  - 感情分析:', health.services.sentiment);
      console.log('  - 要約:', health.services.summary);
    }
  } catch (error: any) {
    console.error('ヘルスチェックエラー:', error.message);
  }
}

/**
 * サンプル2: 音声文字起こし
 */
async function transcribeAudio() {
  console.log('\n=== 音声文字起こし ===');
  try {
    // 実際の使用時は、音声ファイルをBase64エンコードしてください
    const audioBase64 = 'SGVsbG8gV29ybGQ='; // サンプルデータ
    
    const result = await client.transcribe({
      audio: audioBase64,
      format: 'mp3',
      language: 'ja',
    });
    
    console.log('文字起こし結果:', result.text);
    console.log('検出言語:', result.detectedLanguage);
    console.log('信頼度:', `${(result.confidence! * 100).toFixed(1)}%`);
    console.log('処理時間:', `${result.processingTime}ms`);
  } catch (error: any) {
    console.error('文字起こしエラー:', error.message);
  }
}

/**
 * サンプル3: 感情分析
 */
async function analyzeSentiment() {
  console.log('\n=== 感情分析 ===');
  
  const texts = [
    '今日はとても良い天気で、気分も最高です！',
    '雨が降っていて、少し憂鬱な気分です。',
    '明日の会議について考えています。',
  ];
  
  for (const text of texts) {
    try {
      const result = await client.analyzeSentiment({
        text: text,
        language: 'ja',
      });
      
      console.log(`\nテキスト: "${text}"`);
      console.log(`感情: ${result.label} (スコア: ${result.score.toFixed(2)})`);
      console.log(`信頼度: ${(result.confidence * 100).toFixed(1)}%`);
      
      if (result.emotions) {
        console.log('詳細な感情:');
        Object.entries(result.emotions).forEach(([emotion, score]) => {
          if (score && score > 0) {
            console.log(`  - ${emotion}: ${(score * 100).toFixed(1)}%`);
          }
        });
      }
    } catch (error: any) {
      console.error(`感情分析エラー (${text}):`, error.message);
    }
  }
}

/**
 * サンプル4: 要約抽出
 */
async function extractSummary() {
  console.log('\n=== 要約抽出 ===');
  
  const longText = `
    人工知能（AI）は、近年急速に発展している技術分野です。
    機械学習、特にディープラーニングの進歩により、画像認識、自然言語処理、
    音声認識などの分野で人間に匹敵する、あるいはそれを超える性能を
    達成しています。
    
    AIの応用分野は多岐にわたり、医療診断、自動運転、金融取引、
    エンターテインメントなど、私たちの生活のあらゆる側面に影響を
    与え始めています。
    
    しかし、AIの発展には倫理的な課題も伴います。プライバシーの保護、
    アルゴリズムのバイアス、雇用への影響など、社会全体で議論すべき
    重要な問題が存在します。
  `;
  
  try {
    const result = await client.extractSummary({
      text: longText,
      maxLength: 100,
      type: 'extractive',
      language: 'ja',
    });
    
    console.log('要約:', result.summary);
    
    if (result.keyPoints && result.keyPoints.length > 0) {
      console.log('\nキーポイント:');
      result.keyPoints.forEach((point, index) => {
        console.log(`${index + 1}. ${point}`);
      });
    }
    
    if (result.keywords && result.keywords.length > 0) {
      console.log('\nキーワード:', result.keywords.join(', '));
    }
    
    console.log(`\n処理時間: ${result.processingTime}ms`);
  } catch (error: any) {
    console.error('要約抽出エラー:', error.message);
  }
}

/**
 * サンプル5: レート制限の確認
 */
async function checkRateLimit() {
  console.log('\n=== レート制限情報 ===');
  
  const info = client.getRateLimitInfo();
  console.log('制限値:', `${info.limit}リクエスト/分`);
  console.log('残りリクエスト数:', info.remaining);
  console.log('リセット時刻:', new Date(info.reset * 1000).toLocaleString('ja-JP'));
}

/**
 * サンプル6: エラーハンドリング
 */
async function demonstrateErrorHandling() {
  console.log('\n=== エラーハンドリングの例 ===');
  
  try {
    // 無効なリクエストを送信（空のテキスト）
    await client.analyzeSentiment({
      text: '',
      language: 'ja',
    });
  } catch (error: any) {
    console.log('エラーが発生しました:');
    console.log('  - メッセージ:', error.message);
    console.log('  - ステータス:', error.status);
    console.log('  - コード:', error.code);
    console.log('  - リトライ可能:', error.retryable || false);
    
    if (error.status === 429) {
      console.log('  - レート制限に達しました');
      if (error.retryAfter) {
        console.log(`  - ${error.retryAfter}秒後に再試行してください`);
      }
    }
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('TeleAI API統合サンプル');
  console.log('='.repeat(50));
  
  // 各機能のデモンストレーション
  await checkHealth();
  await checkRateLimit();
  await analyzeSentiment();
  await extractSummary();
  await demonstrateErrorHandling();
  
  // 注意: 実際の音声データがないため、文字起こしはコメントアウト
  // await transcribeAudio();
  
  console.log('\n' + '='.repeat(50));
  console.log('デモンストレーション完了');
}

// エラーハンドリング付きで実行
main().catch(error => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});