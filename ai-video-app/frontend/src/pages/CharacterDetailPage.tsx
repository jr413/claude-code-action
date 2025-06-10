import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import clsx from 'clsx';

interface Scenario {
  id: string;
  title: string;
  description: string;
  duration: number;
  intensity_level: number;
  tags: string[];
}

export const CharacterDetailPage = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const { data: character, isLoading: characterLoading } = useQuery(
    ['character', characterId],
    async () => {
      const response = await axios.get(`/characters/${characterId}`);
      return response.data.data;
    }
  );

  const { data: scenarios, isLoading: scenariosLoading } = useQuery(
    ['scenarios', characterId],
    async () => {
      const response = await axios.get(`/characters/${characterId}/scenarios`);
      return response.data.data;
    },
    {
      enabled: !!characterId,
    }
  );

  const generateMutation = useMutation(
    async () => {
      if (!selectedScenario) throw new Error('シナリオを選択してください');
      
      const response = await axios.post('/content/generate', {
        characterId,
        scenarioId: selectedScenario,
      });
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        toast.success('動画生成を開始しました');
        navigate(`/player/${data.sessionId}`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || '動画生成に失敗しました');
      },
    }
  );

  if (characterLoading || scenariosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Character Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/characters')}
          className="text-gray-400 hover:text-white mb-4 inline-flex items-center"
        >
          ← キャラクター一覧に戻る
        </button>
        
        <div className="flex items-start space-x-6">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-dark-300">
            {character?.avatar_url ? (
              <img
                src={character.avatar_url}
                alt={character.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl">👤</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {character?.display_name}
            </h1>
            <p className="text-gray-400 mb-4">{character?.description}</p>
            {character?.personality && (
              <p className="text-sm text-gray-500">
                <span className="font-medium">性格:</span> {character.personality}
              </p>
            )}
            {character?.voice_actor && (
              <p className="text-sm text-gray-500">
                <span className="font-medium">声優:</span> {character.voice_actor}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">シナリオを選択</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios?.map((scenario: Scenario) => (
            <div
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={clsx(
                'card p-6 cursor-pointer transition-all',
                selectedScenario === scenario.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'hover:border-dark-400'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">
                  {scenario.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {Math.floor(scenario.duration / 60)}分
                  </span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={clsx(
                          'text-xs',
                          i < scenario.intensity_level
                            ? 'text-primary-400'
                            : 'text-dark-500'
                        )}
                      >
                        ♥
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-3">
                {scenario.description}
              </p>
              
              {scenario.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {scenario.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-dark-400 text-gray-300 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={() => generateMutation.mutate()}
          disabled={!selectedScenario || generateMutation.isLoading}
          className="btn-primary px-8 py-3 text-lg flex items-center space-x-2"
        >
          {generateMutation.isLoading ? (
            <>
              <LoadingSpinner size="small" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <span>🎬</span>
              <span>動画を生成する</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};