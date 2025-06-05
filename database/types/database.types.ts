/**
 * Database type definitions for TeleAI Pro Enterprise Data Model
 * Auto-generated from database schema
 */

// Enum types
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

export enum FileStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

export enum AnalysisType {
  SENTIMENT = 'sentiment',
  SUMMARY = 'summary',
  KEYWORDS = 'keywords',
  ENTITIES = 'entities',
  CUSTOM = 'custom'
}

export enum FileFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg',
  M4A = 'm4a',
  FLAC = 'flac',
  WEBM = 'webm'
}

// Table interfaces
export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date | null;
  deleted_at?: Date | null;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: Date;
  created_at: Date;
  last_accessed_at: Date;
  is_revoked: boolean;
}

export interface AudioFile {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: bigint;
  file_format: FileFormat;
  duration_seconds?: number | null;
  sample_rate?: number | null;
  channels?: number | null;
  bit_rate?: number | null;
  status: FileStatus;
  upload_started_at: Date;
  upload_completed_at?: Date | null;
  processing_started_at?: Date | null;
  processing_completed_at?: Date | null;
  metadata: Record<string, any>;
  error_message?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface Transcription {
  id: string;
  audio_file_id: string;
  version: number;
  transcription_text: string;
  language_code: string;
  confidence_score?: number | null;
  word_count?: number | null;
  processing_time_ms?: number | null;
  engine_used?: string | null;
  engine_version?: string | null;
  metadata: Record<string, any>;
  is_latest: boolean;
  created_at: Date;
  created_by?: string | null;
}

export interface Analysis {
  id: string;
  transcription_id: string;
  analysis_type: AnalysisType;
  result: Record<string, any>;
  confidence_scores: Record<string, number>;
  processing_time_ms?: number | null;
  model_used?: string | null;
  model_version?: string | null;
  parameters: Record<string, any>;
  metadata: Record<string, any>;
  created_at: Date;
  created_by?: string | null;
}

// View interfaces
export interface UserActivitySummary {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  total_files: number;
  total_transcriptions: number;
  total_analyses: number;
  last_upload?: Date | null;
  last_login_at?: Date | null;
}

export interface FileProcessingAnalytics {
  date: Date;
  file_format: FileFormat;
  status: FileStatus;
  file_count: number;
  avg_file_size: number;
  avg_duration?: number | null;
  avg_processing_time_seconds?: number | null;
}

// Input types for creating/updating records
export interface CreateUserInput {
  email: string;
  username: string;
  password_hash: string;
  role?: UserRole;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  password_hash?: string;
  role?: UserRole;
  is_active?: boolean;
  metadata?: Record<string, any>;
  last_login_at?: Date;
}

export interface CreateAudioFileInput {
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: bigint;
  file_format: FileFormat;
  duration_seconds?: number;
  sample_rate?: number;
  channels?: number;
  bit_rate?: number;
  metadata?: Record<string, any>;
}

export interface UpdateAudioFileInput {
  status?: FileStatus;
  upload_completed_at?: Date;
  processing_started_at?: Date;
  processing_completed_at?: Date;
  metadata?: Record<string, any>;
  error_message?: string;
}

export interface CreateTranscriptionInput {
  audio_file_id: string;
  transcription_text: string;
  language_code?: string;
  confidence_score?: number;
  word_count?: number;
  processing_time_ms?: number;
  engine_used?: string;
  engine_version?: string;
  metadata?: Record<string, any>;
  created_by?: string;
}

export interface CreateAnalysisInput {
  transcription_id: string;
  analysis_type: AnalysisType;
  result: Record<string, any>;
  confidence_scores?: Record<string, number>;
  processing_time_ms?: number;
  model_used?: string;
  model_version?: string;
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
  created_by?: string;
}

// Query filter types
export interface UserFilter {
  role?: UserRole;
  is_active?: boolean;
  created_after?: Date;
  created_before?: Date;
}

export interface AudioFileFilter {
  user_id?: string;
  status?: FileStatus;
  file_format?: FileFormat;
  created_after?: Date;
  created_before?: Date;
}

export interface TranscriptionFilter {
  audio_file_id?: string;
  language_code?: string;
  is_latest?: boolean;
  created_after?: Date;
  created_before?: Date;
}

export interface AnalysisFilter {
  transcription_id?: string;
  analysis_type?: AnalysisType;
  created_after?: Date;
  created_before?: Date;
}

// Response types with relations
export interface UserWithStats extends User {
  total_files: number;
  total_transcriptions: number;
  total_analyses: number;
}

export interface AudioFileWithTranscription extends AudioFile {
  latest_transcription?: Transcription;
}

export interface TranscriptionWithAnalyses extends Transcription {
  analyses: Analysis[];
}

export interface FullAudioFileData extends AudioFile {
  user: User;
  transcriptions: Transcription[];
  analyses: Analysis[];
}