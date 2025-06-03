/**
 * TeleAI Pro データベース型定義
 * 
 * このファイルは、データベーススキーマに基づいたTypeScriptの型定義を提供します。
 * データベーススキーマを変更した場合は、このファイルも更新してください。
 */

// ユーザーロールの列挙型
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

// 音声ファイルステータスの列挙型
export enum AudioFileStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  DELETED = 'deleted'
}

// 処理ステータスの列挙型
export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// ユーザーテーブルの型定義
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  is_active: boolean;
  role: UserRole;
}

// セッションテーブルの型定義
export interface Session {
  id: string;
  user_id: string;
  token: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  expires_at: Date;
  is_active: boolean;
}

// 音声ファイルテーブルの型定義
export interface AudioFile {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  duration_seconds?: number;
  sample_rate?: number;
  bit_rate?: number;
  channels?: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  status: AudioFileStatus;
  metadata?: Record<string, any>;
}

// 文字起こしテーブルの型定義
export interface Transcription {
  id: string;
  audio_file_id: string;
  user_id: string;
  transcription_text: string;
  language_code: string;
  confidence_score?: number;
  word_count?: number;
  processing_time_ms?: number;
  created_at: Date;
  updated_at: Date;
  status: ProcessingStatus;
  error_message?: string;
  metadata?: Record<string, any>;
}

// 分析結果テーブルの型定義
export interface Analysis {
  id: string;
  transcription_id: string;
  user_id: string;
  analysis_type: string;
  summary?: string;
  key_points?: string[];
  sentiment_score?: number;
  entities?: Record<string, any>;
  topics?: string[];
  created_at: Date;
  updated_at: Date;
  processing_time_ms?: number;
  status: ProcessingStatus;
  error_message?: string;
  metadata?: Record<string, any>;
}

// ユーザー統計ビューの型定義
export interface UserStatistics {
  id: string;
  username: string;
  email: string;
  total_audio_files: number;
  total_transcriptions: number;
  total_analyses: number;
  last_upload_at?: Date;
  last_transcription_at?: Date;
  last_analysis_at?: Date;
}

// 処理状況サマリービューの型定義
export interface ProcessingStatusSummary {
  entity_type: 'audio_files' | 'transcriptions' | 'analyses';
  status: string;
  count: number;
}

// リレーションシップを含む型定義
export interface UserWithRelations extends User {
  sessions?: Session[];
  audio_files?: AudioFile[];
  transcriptions?: Transcription[];
  analyses?: Analysis[];
}

export interface AudioFileWithRelations extends AudioFile {
  user?: User;
  transcriptions?: Transcription[];
}

export interface TranscriptionWithRelations extends Transcription {
  user?: User;
  audio_file?: AudioFile;
  analyses?: Analysis[];
}

export interface AnalysisWithRelations extends Analysis {
  user?: User;
  transcription?: Transcription;
}

// 作成/更新用の入力型定義
export type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
export type UpdateUserInput = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;

export type CreateAudioFileInput = Omit<AudioFile, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
export type UpdateAudioFileInput = Partial<Omit<AudioFile, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

export type CreateTranscriptionInput = Omit<Transcription, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTranscriptionInput = Partial<Omit<Transcription, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'audio_file_id'>>;

export type CreateAnalysisInput = Omit<Analysis, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAnalysisInput = Partial<Omit<Analysis, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'transcription_id'>>;

// ページネーション用の型定義
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// フィルター用の型定義
export interface AudioFileFilter {
  user_id?: string;
  status?: AudioFileStatus;
  mime_type?: string;
  created_after?: Date;
  created_before?: Date;
}

export interface TranscriptionFilter {
  user_id?: string;
  audio_file_id?: string;
  status?: ProcessingStatus;
  language_code?: string;
  created_after?: Date;
  created_before?: Date;
}

export interface AnalysisFilter {
  user_id?: string;
  transcription_id?: string;
  analysis_type?: string;
  status?: ProcessingStatus;
  created_after?: Date;
  created_before?: Date;
}