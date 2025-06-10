import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/sea/index.css';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const VideoPlayerPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  const { data: session, isLoading, refetch } = useQuery(
    ['session', sessionId],
    async () => {
      const response = await axios.get(`/content/session/${sessionId}`);
      return response.data.data;
    },
    {
      refetchInterval: (data) => {
        // Refetch every 5 seconds if still processing
        return data?.video_generation_status === 'processing' ? 5000 : false;
      },
    }
  );

  useEffect(() => {
    // Initialize video player when video is ready
    if (session?.video_url && session?.audio_url && videoRef.current && !playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        aspectRatio: '16:9',
        sources: [
          {
            src: session.video_url,
            type: 'video/mp4',
          },
        ],
      });

      // Add audio track
      playerRef.current.audioTracks().addTrack(
        new videojs.AudioTrack({
          id: 'ja',
          kind: 'main',
          label: 'Japanese',
          language: 'ja',
          src: session.audio_url,
        })
      );
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="text-gray-400 hover:text-white mb-4 inline-flex items-center"
      >
        ← ダッシュボードに戻る
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <div className="card">
            {session?.video_generation_status === 'completed' ? (
              <div data-vjs-player>
                <video
                  ref={videoRef}
                  className="video-js vjs-theme-sea vjs-big-play-centered"
                />
              </div>
            ) : session?.video_generation_status === 'processing' ? (
              <div className="aspect-w-16 aspect-h-9 bg-dark-300 flex items-center justify-center">
                <div className="text-center">
                  <LoadingSpinner size="large" className="mb-4" />
                  <p className="text-white font-semibold mb-2">動画を生成中...</p>
                  <p className="text-gray-400 text-sm">
                    しばらくお待ちください（約30秒）
                  </p>
                </div>
              </div>
            ) : session?.video_generation_status === 'failed' ? (
              <div className="aspect-w-16 aspect-h-9 bg-dark-300 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl mb-4">😢</span>
                  <p className="text-white font-semibold mb-2">生成に失敗しました</p>
                  <p className="text-gray-400 text-sm mb-4">
                    {session.error_message || '技術的な問題が発生しました'}
                  </p>
                  <button
                    onClick={() => navigate('/characters')}
                    className="btn-secondary"
                  >
                    別のシナリオを試す
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-w-16 aspect-h-9 bg-dark-300 flex items-center justify-center">
                <p className="text-gray-400">動画を準備中...</p>
              </div>
            )}
          </div>
        </div>

        {/* Session Info */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">セッション情報</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">キャラクター</p>
                <p className="text-white font-medium">
                  {session?.character_display_name}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">シナリオ</p>
                <p className="text-white font-medium">
                  {session?.scenario_title}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">再生時間</p>
                <p className="text-white font-medium">
                  {session?.scenario_duration ? 
                    `${Math.floor(session.scenario_duration / 60)}分${session.scenario_duration % 60}秒` :
                    '---'
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">ステータス</p>
                <p className={`font-medium ${
                  session?.video_generation_status === 'completed'
                    ? 'text-green-400'
                    : session?.video_generation_status === 'processing'
                    ? 'text-yellow-400'
                    : session?.video_generation_status === 'failed'
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}>
                  {session?.video_generation_status === 'completed' ? '完了' :
                   session?.video_generation_status === 'processing' ? '処理中' :
                   session?.video_generation_status === 'failed' ? '失敗' :
                   '保留中'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-3">説明</h3>
            <p className="text-gray-400 text-sm">
              {session?.scenario_description}
            </p>
          </div>

          <button
            onClick={() => navigate(`/characters/${session?.character_id}`)}
            className="btn-secondary w-full"
          >
            他のシナリオを見る
          </button>
        </div>
      </div>
    </div>
  );
};