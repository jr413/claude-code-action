/**
 * TeleAI Pro Database Types
 * TypeScript type definitions for database schema
 */

// Enum Types
export type UserRole = 'admin' | 'user' | 'viewer';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AudioFileStatus = 'uploaded' | 'processing' | 'ready' | 'error';
export type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'mixed';

// User Interface
export interface User {
  id: string; // UUID
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Session Interface
export interface Session {
  id: string; // UUID
  user_id: string; // UUID
  token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Audio File Interface
export interface AudioFile {
  id: string; // UUID
  user_id: string; // UUID
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  duration_seconds: number | null;
  mime_type: string;
  sample_rate: number | null;
  channels: number | null;
  bit_rate: number | null;
  status: AudioFileStatus;
  upload_completed_at: Date | null;
  processing_started_at: Date | null;
  processing_completed_at: Date | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Transcription Interface
export interface Transcription {
  id: string; // UUID
  audio_file_id: string; // UUID
  user_id: string; // UUID
  transcription_text: string;
  language_code: string;
  confidence_score: number | null;
  word_count: number | null;
  status: TranscriptionStatus;
  engine: string;
  engine_version: string | null;
  processing_started_at: Date | null;
  processing_completed_at: Date | null;
  processing_duration_ms: number | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Analysis Interface
export interface Analysis {
  id: string; // UUID
  transcription_id: string; // UUID
  audio_file_id: string; // UUID
  user_id: string; // UUID
  analysis_type: string;
  sentiment_score: number | null;
  sentiment_label: SentimentLabel | null;
  key_phrases: string[];
  entities: EntityExtraction[];
  topics: TopicModel[];
  summary: string | null;
  insights: AnalysisInsights;
  status: AnalysisStatus;
  engine: string;
  engine_version: string | null;
  processing_started_at: Date | null;
  processing_completed_at: Date | null;
  processing_duration_ms: number | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Supporting Types for Analysis
export interface EntityExtraction {
  text: string;
  type: string;
  confidence: number;
  start_position?: number;
  end_position?: number;
}

export interface TopicModel {
  topic: string;
  confidence: number;
  keywords: string[];
}

export interface AnalysisInsights {
  summary_points?: string[];
  action_items?: string[];
  risks?: string[];
  opportunities?: string[];
  [key: string]: any; // Allow for flexible insights
}

// View Types
export interface UserFileStats {
  user_id: string;
  email: string;
  full_name: string;
  total_files: number;
  total_transcriptions: number;
  total_analyses: number;
  total_storage_bytes: number;
  total_duration_seconds: number;
  last_upload_at: Date | null;
}

export interface DailyUsageStats {
  date: Date;
  active_users: number;
  total_uploads: number;
  total_bytes_uploaded: number;
  total_audio_seconds: number;
  avg_audio_duration: number;
}

export interface RecentUserActivity {
  user_id: string;
  email: string;
  full_name: string;
  activity_type: 'audio_upload' | 'transcription' | 'analysis';
  resource_id: string;
  resource_name: string;
  activity_timestamp: Date;
}

export interface ProcessingQueueStatus {
  queue_type: 'audio_files' | 'transcriptions' | 'analyses';
  status: string;
  count: number;
  oldest_item: Date;
  newest_item: Date;
}

export interface FileProcessingPipeline {
  audio_file_id: string;
  user_id: string;
  file_name: string;
  audio_status: AudioFileStatus;
  audio_uploaded_at: Date;
  transcription_id: string | null;
  transcription_status: TranscriptionStatus | null;
  transcription_created_at: Date | null;
  analysis_id: string | null;
  analysis_status: AnalysisStatus | null;
  analysis_type: string | null;
  analysis_created_at: Date | null;
  pipeline_status: PipelineStatus;
}

export type PipelineStatus = 
  | 'failed'
  | 'completed'
  | 'analysis_in_progress'
  | 'transcription_completed'
  | 'transcription_in_progress'
  | 'audio_ready'
  | 'audio_processing'
  | 'uploaded';

// Query Types for common operations
export interface CreateUserInput {
  email: string;
  password_hash: string;
  full_name: string;
  role?: UserRole;
}

export interface CreateAudioFileInput {
  user_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  metadata?: Record<string, any>;
}

export interface CreateTranscriptionInput {
  audio_file_id: string;
  user_id: string;
  transcription_text: string;
  language_code: string;
  engine: string;
  confidence_score?: number;
  word_count?: number;
  metadata?: Record<string, any>;
}

export interface CreateAnalysisInput {
  transcription_id: string;
  audio_file_id: string;
  user_id: string;
  analysis_type: string;
  engine: string;
  sentiment_score?: number;
  sentiment_label?: SentimentLabel;
  key_phrases?: string[];
  entities?: EntityExtraction[];
  topics?: TopicModel[];
  summary?: string;
  insights?: AnalysisInsights;
  metadata?: Record<string, any>;
}

// Pagination Types
export interface PaginationParams {
  limit: number;
  offset: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Filter Types
export interface AudioFileFilters {
  user_id?: string;
  status?: AudioFileStatus;
  mime_type?: string;
  created_after?: Date;
  created_before?: Date;
}

export interface TranscriptionFilters {
  user_id?: string;
  audio_file_id?: string;
  status?: TranscriptionStatus;
  language_code?: string;
  search_text?: string;
}

export interface AnalysisFilters {
  user_id?: string;
  transcription_id?: string;
  audio_file_id?: string;
  status?: AnalysisStatus;
  analysis_type?: string;
  sentiment_label?: SentimentLabel;
}