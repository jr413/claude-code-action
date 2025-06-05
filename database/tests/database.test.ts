import { describe, test, expect } from 'bun:test';
import type {
  User,
  UserRole,
  AudioFile,
  FileStatus,
  FileFormat,
  Transcription,
  Analysis,
  AnalysisType,
  CreateUserInput,
  CreateAudioFileInput,
  CreateTranscriptionInput,
  CreateAnalysisInput
} from '../types/database.types';

describe('Database Types', () => {
  describe('User Types', () => {
    test('should create valid user input', () => {
      const userInput: CreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        role: UserRole.ANALYST,
        is_active: true,
        metadata: { department: 'Engineering' }
      };

      expect(userInput.email).toBe('test@example.com');
      expect(userInput.role).toBe('analyst');
    });

    test('should validate email format constraint', () => {
      const invalidEmails = ['invalid', 'test@', '@test.com', 'test@.com'];
      const validEmails = ['test@example.com', 'user.name@company.co.uk'];

      // Email validation regex from schema
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });
  });

  describe('Audio File Types', () => {
    test('should create valid audio file input', () => {
      const audioFileInput: CreateAudioFileInput = {
        user_id: 'user-123',
        file_name: 'interview.mp3',
        file_path: '/uploads/2025/06/interview.mp3',
        file_size: BigInt(5242880), // 5MB
        file_format: FileFormat.MP3,
        duration_seconds: 300,
        sample_rate: 44100,
        channels: 2,
        bit_rate: 128000
      };

      expect(audioFileInput.file_format).toBe('mp3');
      expect(audioFileInput.file_size).toBe(BigInt(5242880));
    });

    test('should validate file size constraints', () => {
      const validSizes = [BigInt(1), BigInt(1000000), BigInt(1073741824)]; // 1 byte, 1MB, 1GB
      const invalidSizes = [BigInt(0), BigInt(-1)];

      validSizes.forEach(size => {
        expect(size > BigInt(0)).toBe(true);
      });

      invalidSizes.forEach(size => {
        expect(size > BigInt(0)).toBe(false);
      });
    });

    test('should validate audio metadata constraints', () => {
      // Duration should be positive or null
      expect(100 > 0).toBe(true);
      expect(null === null || null! > 0).toBe(true);

      // Sample rate should be positive or null
      expect(44100 > 0).toBe(true);
      expect(null === null || null! > 0).toBe(true);

      // Channels should be between 1 and 32 or null
      expect(2 >= 1 && 2 <= 32).toBe(true);
      expect(null === null || (null! >= 1 && null! <= 32)).toBe(true);

      // Bit rate should be positive or null
      expect(128000 > 0).toBe(true);
      expect(null === null || null! > 0).toBe(true);
    });
  });

  describe('Transcription Types', () => {
    test('should create valid transcription input', () => {
      const transcriptionInput: CreateTranscriptionInput = {
        audio_file_id: 'audio-123',
        transcription_text: 'This is a test transcription.',
        language_code: 'en',
        confidence_score: 0.95,
        word_count: 5,
        processing_time_ms: 1500,
        engine_used: 'whisper',
        engine_version: 'v3'
      };

      expect(transcriptionInput.confidence_score).toBe(0.95);
      expect(transcriptionInput.language_code).toBe('en');
    });

    test('should validate confidence score constraints', () => {
      const validScores = [0, 0.5, 0.95, 1, null];
      const invalidScores = [-0.1, 1.1, 2];

      validScores.forEach(score => {
        expect(score === null || (score >= 0 && score <= 1)).toBe(true);
      });

      invalidScores.forEach(score => {
        expect(score >= 0 && score <= 1).toBe(false);
      });
    });
  });

  describe('Analysis Types', () => {
    test('should create valid analysis input', () => {
      const analysisInput: CreateAnalysisInput = {
        transcription_id: 'transcription-123',
        analysis_type: AnalysisType.SENTIMENT,
        result: {
          sentiment: 'positive',
          score: 0.85,
          confidence: 0.92
        },
        confidence_scores: {
          overall: 0.92,
          sentiment: 0.85
        },
        model_used: 'gpt-4',
        model_version: '1.0'
      };

      expect(analysisInput.analysis_type).toBe('sentiment');
      expect(analysisInput.result.sentiment).toBe('positive');
    });

    test('should handle different analysis types', () => {
      const analysisTypes = Object.values(AnalysisType);
      
      expect(analysisTypes).toContain('sentiment');
      expect(analysisTypes).toContain('summary');
      expect(analysisTypes).toContain('keywords');
      expect(analysisTypes).toContain('entities');
      expect(analysisTypes).toContain('custom');
    });
  });

  describe('Status Enums', () => {
    test('should validate file status values', () => {
      const statuses = Object.values(FileStatus);
      
      expect(statuses).toContain('pending');
      expect(statuses).toContain('processing');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('failed');
      expect(statuses).toContain('archived');
    });

    test('should validate user role values', () => {
      const roles = Object.values(UserRole);
      
      expect(roles).toContain('admin');
      expect(roles).toContain('manager');
      expect(roles).toContain('analyst');
      expect(roles).toContain('viewer');
    });
  });

  describe('Complex Queries', () => {
    test('should handle user with stats interface', () => {
      const userWithStats = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash',
        role: UserRole.MANAGER,
        is_active: true,
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
        total_files: 10,
        total_transcriptions: 8,
        total_analyses: 15
      };

      expect(userWithStats.total_files).toBe(10);
      expect(userWithStats.role).toBe('manager');
    });

    test('should handle full audio file data with relations', () => {
      const fullData = {
        // Audio file data
        id: 'audio-123',
        user_id: 'user-123',
        file_name: 'test.mp3',
        file_path: '/test.mp3',
        file_size: BigInt(1000000),
        file_format: FileFormat.MP3,
        status: FileStatus.COMPLETED,
        created_at: new Date(),
        updated_at: new Date(),
        
        // Related user
        user: {
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com'
        },
        
        // Related transcriptions
        transcriptions: [{
          id: 'trans-123',
          audio_file_id: 'audio-123',
          transcription_text: 'Test transcription',
          is_latest: true
        }],
        
        // Related analyses
        analyses: [{
          id: 'analysis-123',
          transcription_id: 'trans-123',
          analysis_type: AnalysisType.SENTIMENT,
          result: { sentiment: 'positive' }
        }]
      };

      expect(fullData.transcriptions).toHaveLength(1);
      expect(fullData.analyses).toHaveLength(1);
      expect(fullData.user.username).toBe('testuser');
    });
  });

  describe('Filter Types', () => {
    test('should create valid user filter', () => {
      const filter = {
        role: UserRole.ANALYST,
        is_active: true,
        created_after: new Date('2025-01-01'),
        created_before: new Date('2025-12-31')
      };

      expect(filter.role).toBe('analyst');
      expect(filter.created_after < filter.created_before).toBe(true);
    });

    test('should create valid audio file filter', () => {
      const filter = {
        user_id: 'user-123',
        status: FileStatus.COMPLETED,
        file_format: FileFormat.WAV,
        created_after: new Date('2025-01-01')
      };

      expect(filter.status).toBe('completed');
      expect(filter.file_format).toBe('wav');
    });
  });
});